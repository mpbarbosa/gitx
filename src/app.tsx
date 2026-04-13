import {execFile} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {Box, Text, useApp, useInput} from 'ink';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {DirectoryTextBrowserWithStatusBar, StatusBar} from './pajussara-cdn.js';
import type {DirectoryTextBrowserPane, StatusBarHint, TextListItem} from './pajussara-cdn.js';

const rootDirectory = '/home/mpb/Documents/GitHub';
const primaryStatusBarHints = [
	{key: 'q', label: 'Quit'},
	{key: 'Tab', label: 'Focus'},
	{key: '↑/↓ j/k', label: 'Move'},
	{key: 'PgUp/PgDn', label: 'Page'},
	{key: 'r', label: 'git fetch --prune'},
	{key: 's', label: 'git status'},
	{key: 'd', label: 'git diff'},
	{key: 'b', label: 'git branch'},
	{key: 'l', label: 'git log'},
	{key: 'p', label: 'git pull'},
	{key: 'x', label: 'git push'}
] as const;
type GitCommandStatus = 'idle' | 'loading' | 'done' | 'error';
type GitTextView = 'status' | 'diff' | 'branch' | 'log';
type GitLogOptionId = 'default' | 'oneline';
type TextEntriesCache = Record<string, TextListItem[]>;
type ExecGitError = Error & {stdout?: string; stderr?: string};

function formatGitCommandLabel(args: readonly string[]): string {
	return `git ${args.join(' ')}`;
}

function toUtf8Text(output: string | Buffer): string {
	return typeof output === 'string' ? output : output.toString('utf8');
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	return error instanceof Error ? error.message : fallbackMessage;
}

function createExecGitError(
	error: unknown,
	stdout: string | Buffer,
	stderr: string | Buffer
): ExecGitError {
	const execError: ExecGitError =
		error instanceof Error ? error : new Error(getErrorMessage(error, 'Unknown git command error'));

	execError.stdout = toUtf8Text(stdout);
	execError.stderr = toUtf8Text(stderr);
	return execError;
}

function execGit(args: readonly string[], cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile('git', [...args], {cwd, encoding: 'utf8'}, (error, stdout, stderr) => {
			if (error) {
				reject(createExecGitError(error, stdout, stderr));
				return;
			}

			resolve(toUtf8Text(stdout));
		});
	});
}

const gitLogOptions = {
	default: {
		id: 'default',
		args: [] as string[],
		label: 'no command options',
		titleSuffix: ''
	},
	oneline: {
		id: 'oneline',
		args: ['--oneline'],
		label: '--oneline',
		titleSuffix: ' --oneline'
	}
} as const satisfies Record<
	GitLogOptionId,
	{id: GitLogOptionId; args: string[]; label: string; titleSuffix: string}
>;

function getGitLogOptionHints(selectedOptionId: GitLogOptionId): StatusBarHint[] {
	return [
		{
			key: '1',
			label:
				selectedOptionId === 'default' ? '> no command options' : 'no command options'
		},
		{
			key: '2',
			label: selectedOptionId === 'oneline' ? '> --oneline' : '--oneline'
		},
		{key: 'Enter', label: 'Run'},
		{key: 'Esc', label: 'Cancel'}
	];
}

async function getChildDirectories(directoryPath: string): Promise<string[]> {
	const entries = await readdir(directoryPath, {withFileTypes: true});

	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(directoryPath, entry.name))
		.sort((left, right) => left.localeCompare(right));
}

function getStatusFromLine(line: string): TextListItem['status'] {
	if (line.startsWith('##')) {
		return 'running';
	}

	if (line.startsWith('??')) {
		return 'pending';
	}

	if (line.trim().length === 0) {
		return 'pending';
	}

	return 'done';
}

function getGitErrorMessage(error: unknown): string {
	if (
		typeof error === 'object' &&
		error !== null &&
		'stderr' in error &&
		(typeof error.stderr === 'string' || Buffer.isBuffer(error.stderr))
	) {
		const stderrMessage = error.stderr.toString().trim();
		if (stderrMessage.length > 0) {
			return stderrMessage;
		}
	}

	return getErrorMessage(error, 'Unknown git command error');
}

async function getGitStatusEntries(directoryPath: string | null): Promise<TextListItem[]> {
	if (!directoryPath) {
		return [];
	}

	try {
		const output = await execGit(['status', '--short', '--branch'], directoryPath);
		const lines = output
			.split('\n')
			.map((line) => line.trimEnd())
			.filter((line) => line.length > 0);

		if (lines.length === 0) {
			return [
				{
					id: `${directoryPath}:clean`,
					text: 'Working tree clean.',
					status: 'done'
				}
			];
		}

		return lines.map((line, index) => ({
			id: `${directoryPath}:git-status:${index}`,
			text: line,
			status: getStatusFromLine(line)
		}));
	} catch (error) {
		const message = getGitErrorMessage(error);

		if (message.toLowerCase().includes('not a git repository')) {
			return [
				{
					id: `${directoryPath}:not-a-git-repo`,
					text: 'Info: This folder is not a Git repository.',
					status: 'pending'
				}
			];
		}

		return [
			{
				id: `${directoryPath}:error`,
				text: `git status failed: ${message}`,
				status: 'error'
			}
		];
	}
}

function getBranchStatusFromLine(line: string): TextListItem['status'] {
	if (line.startsWith('*')) {
		return 'running';
	}

	if (line.trim().length === 0) {
		return 'pending';
	}

	return 'done';
}

function getDiffStatusFromLine(line: string): TextListItem['status'] {
	if (
		line.startsWith('diff --git') ||
		line.startsWith('index ') ||
		line.startsWith('--- ') ||
		line.startsWith('+++ ')
	) {
		return 'running';
	}

	if (line.startsWith('@@')) {
		return 'pending';
	}

	if (line.startsWith('+') && !line.startsWith('+++ ')) {
		return 'done';
	}

	if (line.startsWith('-') && !line.startsWith('--- ')) {
		return 'error';
	}

	return 'pending';
}

async function getGitDiffEntries(directoryPath: string | null): Promise<TextListItem[]> {
	if (!directoryPath) {
		return [];
	}

	try {
		const output = await execGit(['diff'], directoryPath);
		const lines = output.split('\n').map((line) => line.trimEnd());

		if (lines.every((line) => line.length === 0)) {
			return [
				{
					id: `${directoryPath}:clean-diff`,
					text: 'No unstaged changes.',
					status: 'done'
				}
			];
		}

		return lines.map((line, index) => ({
			id: `${directoryPath}:git-diff:${index}`,
			text: line.length === 0 ? ' ' : line,
			status: getDiffStatusFromLine(line)
		}));
	} catch (error) {
		const message = getGitErrorMessage(error);

		if (message.toLowerCase().includes('not a git repository')) {
			return [
				{
					id: `${directoryPath}:not-a-git-repo-diff`,
					text: 'Info: This folder is not a Git repository.',
					status: 'pending'
				}
			];
		}

		return [
			{
				id: `${directoryPath}:diff-error`,
				text: `git diff failed: ${message}`,
				status: 'error'
			}
		];
	}
}

async function getGitBranchEntries(directoryPath: string | null): Promise<TextListItem[]> {
	if (!directoryPath) {
		return [];
	}

	try {
		const output = await execGit(['branch'], directoryPath);
		const lines = output
			.split('\n')
			.map((line) => line.trimEnd())
			.filter((line) => line.length > 0);

		if (lines.length === 0) {
			return [
				{
					id: `${directoryPath}:no-branches`,
					text: 'No local branches.',
					status: 'pending'
				}
			];
		}

		return lines.map((line, index) => ({
			id: `${directoryPath}:git-branch:${index}`,
			text: line,
			status: getBranchStatusFromLine(line)
		}));
	} catch (error) {
		const message = getGitErrorMessage(error);

		if (message.toLowerCase().includes('not a git repository')) {
			return [
				{
					id: `${directoryPath}:not-a-git-repo-branch`,
					text: 'Info: This folder is not a Git repository.',
					status: 'pending'
				}
			];
		}

		return [
			{
				id: `${directoryPath}:branch-error`,
				text: `git branch failed: ${message}`,
				status: 'error'
			}
		];
	}
}

function getLogStatusFromLine(line: string): TextListItem['status'] {
	if (line.startsWith('commit ')) {
		return 'running';
	}

	if (line.startsWith('Author:') || line.startsWith('Date:')) {
		return 'pending';
	}

	if (line.trim().length === 0) {
		return 'pending';
	}

	return 'done';
}

async function getGitLogEntries(
	directoryPath: string | null,
	logArgs: readonly string[] = []
): Promise<TextListItem[]> {
	if (!directoryPath) {
		return [];
	}

	try {
		const output = await execGit(['log', ...logArgs], directoryPath);
		const lines = output.split('\n').map((line) => line.trimEnd());

		if (lines.every((line) => line.length === 0)) {
			return [
				{
					id: `${directoryPath}:empty-log`,
					text: 'No commits found.',
					status: 'pending'
				}
			];
		}

		return lines.map((line, index) => ({
			id: `${directoryPath}:git-log:${index}`,
			text: line.length === 0 ? ' ' : line,
			status: getLogStatusFromLine(line)
		}));
	} catch (error) {
		const message = getGitErrorMessage(error);

		if (message.toLowerCase().includes('not a git repository')) {
			return [
				{
					id: `${directoryPath}:not-a-git-repo-log`,
					text: 'Info: This folder is not a Git repository.',
					status: 'pending'
				}
			];
		}

		return [
			{
				id: `${directoryPath}:log-error`,
				text: `git log failed: ${message}`,
				status: 'error'
			}
		];
	}
}

async function getTextEntriesForView(
	textView: GitTextView,
	directoryPath: string | null,
	logArgs: readonly string[] = []
): Promise<TextListItem[]> {
	switch (textView) {
		case 'diff':
			return getGitDiffEntries(directoryPath);
		case 'branch':
			return getGitBranchEntries(directoryPath);
		case 'log':
			return getGitLogEntries(directoryPath, logArgs);
		case 'status':
			return getGitStatusEntries(directoryPath);
	}
}

function getTextLoadingLabel(textView: GitTextView, titleSuffix: string): string {
	switch (textView) {
		case 'diff':
			return 'Loading git diff...';
		case 'branch':
			return 'Loading git branch...';
		case 'log':
			return `Loading git log${titleSuffix}...`;
		case 'status':
			return 'Loading git status...';
	}
}

export function App() {
	const {exit} = useApp();
	const [selectedDirectoryPath, setSelectedDirectoryPath] = useState<string | null>(null);
	const [selectedTextItemId, setSelectedTextItemId] = useState<string | null>(null);
	const [activeTextView, setActiveTextView] = useState<GitTextView>('status');
	const [focusedPane, setFocusedPane] = useState<DirectoryTextBrowserPane>('directories');
	const [gitCommandStatus, setGitCommandStatus] = useState<GitCommandStatus>('idle');
	const [gitCommandLabel, setGitCommandLabel] = useState<string | null>(null);
	const [gitCommandErrorMessage, setGitCommandErrorMessage] = useState<string | null>(null);
	const [directoryRefreshVersion, setDirectoryRefreshVersion] = useState(0);
	const [activeGitLogOptionId, setActiveGitLogOptionId] = useState<GitLogOptionId>('default');
	const [selectedGitLogOptionId, setSelectedGitLogOptionId] =
		useState<GitLogOptionId>('default');
	const [isGitLogHintBarOpen, setIsGitLogHintBarOpen] = useState(false);
	const [textItems, setTextItems] = useState<TextListItem[]>([]);
	const [textEntriesCache, setTextEntriesCache] = useState<TextEntriesCache>({});
	const browserWidth = Math.max(60, (process.stdout.columns ?? 100) - 4);
	const browserHeight = Math.max(
		10,
		(process.stdout.rows ?? 30) - (isGitLogHintBarOpen ? 16 : 13)
	);
	const textPageSize = Math.max(1, browserHeight - 2);
	const activeGitLogOption = gitLogOptions[activeGitLogOptionId];
	const textEntriesCacheKey = useMemo(
		() =>
			selectedDirectoryPath
				? [
						selectedDirectoryPath,
						activeTextView,
						activeGitLogOptionId,
						String(directoryRefreshVersion)
					].join('::')
				: null,
		[activeGitLogOptionId, activeTextView, directoryRefreshVersion, selectedDirectoryPath]
	);
	const cachedTextItems =
		textEntriesCacheKey === null ? undefined : textEntriesCache[textEntriesCacheKey];
	const textLoadingLabel = useMemo(
		() => getTextLoadingLabel(activeTextView, activeGitLogOption.titleSuffix),
		[activeGitLogOption.titleSuffix, activeTextView]
	);

	useEffect(() => {
		let isDisposed = false;

		void getChildDirectories(rootDirectory)
			.then((childDirectories) => {
				if (isDisposed) {
					return;
				}

				setGitCommandErrorMessage(null);
				setSelectedDirectoryPath(
					(currentDirectoryPath) => currentDirectoryPath ?? childDirectories[0] ?? null
				);
			})
			.catch((error) => {
				if (isDisposed) {
					return;
				}

				setGitCommandErrorMessage(
					`Failed to load directories: ${getErrorMessage(error, 'Unknown directory read error')}`
				);
			});

		return () => {
			isDisposed = true;
		};
	}, []);

	useEffect(() => {
		if (!selectedDirectoryPath || !textEntriesCacheKey) {
			setTextItems([]);
			return;
		}

		if (cachedTextItems) {
			setTextItems(cachedTextItems);
			return;
		}

		let isDisposed = false;
		setTextItems([
			{
				id: `${textEntriesCacheKey}:loading`,
				text: textLoadingLabel,
				status: 'running'
			}
		]);

		void getTextEntriesForView(activeTextView, selectedDirectoryPath, activeGitLogOption.args).then(
			(nextTextItems) => {
				if (isDisposed) {
					return;
				}

				setTextEntriesCache((currentCache) => ({
					...currentCache,
					[textEntriesCacheKey]: nextTextItems
				}));
				setTextItems(nextTextItems);
			}
		);

		return () => {
			isDisposed = true;
		};
	}, [
		activeGitLogOption.args,
		activeTextView,
		cachedTextItems,
		selectedDirectoryPath,
		textEntriesCacheKey,
		textLoadingLabel
	]);

	const selectedTextItem = textItems.find((item) => item.id === selectedTextItemId) ?? null;
	const getSelectedTextIndex = useCallback(() => {
		if (textItems.length === 0) {
			return -1;
		}

		if (selectedTextItemId === null) {
			return 0;
		}

		const selectedIndex = textItems.findIndex((item) => item.id === selectedTextItemId);
		return selectedIndex >= 0 ? selectedIndex : 0;
	}, [selectedTextItemId, textItems]);
	const selectTextItemAtIndex = useCallback(
		(nextIndex: number) => {
			if (textItems.length === 0) {
				setSelectedTextItemId(null);
				return;
			}

			const boundedIndex = Math.max(0, Math.min(nextIndex, textItems.length - 1));
			setSelectedTextItemId(textItems[boundedIndex]?.id ?? null);
		},
		[textItems]
	);
	const moveTextSelection = useCallback(
		(delta: number) => {
			const currentIndex = getSelectedTextIndex();
			if (currentIndex < 0) {
				return;
			}

			selectTextItemAtIndex(currentIndex + delta);
		},
		[getSelectedTextIndex, selectTextItemAtIndex]
	);
	const getTextItems = useCallback(
		(directoryPath: string | null) =>
			directoryPath === selectedDirectoryPath ? textItems : [],
		[selectedDirectoryPath, textItems]
	);
	const handleSelectDirectory = useCallback((directoryPath: string | null) => {
		setSelectedDirectoryPath(directoryPath);
		setSelectedTextItemId(null);
		setFocusedPane('directories');
		setGitCommandStatus('idle');
		setGitCommandLabel(null);
		setGitCommandErrorMessage(null);
		setIsGitLogHintBarOpen(false);
	}, []);
	const showTextView = useCallback(
		(nextTextView: GitTextView) => {
			if (!selectedDirectoryPath || gitCommandStatus === 'loading') {
				return;
			}

			setActiveTextView(nextTextView);
			setSelectedTextItemId(null);
			setFocusedPane('text');
			setGitCommandStatus('idle');
			setGitCommandLabel(null);
			setGitCommandErrorMessage(null);
			setDirectoryRefreshVersion((currentVersion) => currentVersion + 1);
		},
		[gitCommandStatus, selectedDirectoryPath]
	);
	const runGitCommand = useCallback(
		async (args: string[]) => {
			if (!selectedDirectoryPath || gitCommandStatus === 'loading') {
				return;
			}

			const commandLabel = formatGitCommandLabel(args);
			setGitCommandStatus('loading');
			setGitCommandLabel(commandLabel);
			setGitCommandErrorMessage(null);

			try {
				await execGit(args, selectedDirectoryPath);
				setGitCommandStatus('done');
			} catch (error) {
				setGitCommandStatus('error');
				setGitCommandErrorMessage(getGitErrorMessage(error));
			} finally {
				setDirectoryRefreshVersion((currentVersion) => currentVersion + 1);
			}
		},
		[gitCommandStatus, selectedDirectoryPath]
	);
	const handleGitPull = useCallback(async () => {
		await runGitCommand(['pull']);
	}, [runGitCommand]);
	const handleGitRefresh = useCallback(async () => {
		await runGitCommand(['fetch', '--prune']);
	}, [runGitCommand]);
	const handleGitDiff = useCallback(() => {
		showTextView('diff');
	}, [showTextView]);
	const handleGitBranch = useCallback(() => {
		showTextView('branch');
	}, [showTextView]);
	const handleGitLog = useCallback(() => {
		if (!selectedDirectoryPath || gitCommandStatus === 'loading') {
			return;
		}

		setSelectedGitLogOptionId(activeGitLogOptionId);
		setIsGitLogHintBarOpen(true);
	}, [activeGitLogOptionId, gitCommandStatus, selectedDirectoryPath]);
	const handleSelectGitLogOption = useCallback((optionId: GitLogOptionId) => {
		setSelectedGitLogOptionId(optionId);
	}, []);
	const handleCloseGitLogHintBar = useCallback(() => {
		setIsGitLogHintBarOpen(false);
	}, []);
	const handleConfirmGitLogOption = useCallback(() => {
		setActiveGitLogOptionId(selectedGitLogOptionId);
		setIsGitLogHintBarOpen(false);
		showTextView('log');
	}, [selectedGitLogOptionId, showTextView]);
	const handleGitStatus = useCallback(() => {
		showTextView('status');
	}, [showTextView]);
	const handleGitPush = useCallback(async () => {
		await runGitCommand(['push']);
	}, [runGitCommand]);
	const textTitle =
		activeTextView === 'diff'
			? 'GIT DIFF'
			: activeTextView === 'branch'
				? 'GIT BRANCH'
				: activeTextView === 'log'
					? `GIT LOG${activeGitLogOption.titleSuffix}`
					: 'GIT STATUS';
	const textPlaceholderText =
		activeTextView === 'diff'
			? 'Select a directory to run git diff in that folder.'
			: activeTextView === 'branch'
				? 'Select a directory to run git branch in that folder.'
				: activeTextView === 'log'
					? `Select a directory to run git log${activeGitLogOption.titleSuffix} in that folder.`
					: 'Select a directory to run git status in that folder.';
	const textEmptyText =
		activeTextView === 'diff'
			? 'git diff returned no lines for this folder.'
			: activeTextView === 'branch'
				? 'git branch returned no lines for this folder.'
				: activeTextView === 'log'
					? `git log${activeGitLogOption.titleSuffix} returned no lines for this folder.`
				: 'git status returned no lines for this folder.';
	const primaryCommandStatusBarHints = useMemo(() => {
		if (!gitCommandLabel || gitCommandStatus === 'idle') {
			return primaryStatusBarHints;
		}

		const commandStateHint =
			gitCommandStatus === 'loading'
				? {key: 'Run', label: gitCommandLabel}
				: gitCommandStatus === 'done'
					? {key: 'Done', label: gitCommandLabel}
					: {key: 'Fail', label: gitCommandLabel};

		return [commandStateHint, ...primaryStatusBarHints];
	}, [gitCommandLabel, gitCommandStatus]);
	const secondaryStatusBarHints = useMemo(
		() => getGitLogOptionHints(selectedGitLogOptionId),
		[selectedGitLogOptionId]
	);

	const handleInput = useCallback((input: string, key: {return?: boolean; escape?: boolean; leftArrow?: boolean; rightArrow?: boolean; upArrow?: boolean; downArrow?: boolean; pageDown?: boolean; pageUp?: boolean; home?: boolean; end?: boolean}) => {
		if (isGitLogHintBarOpen) {
			if (key.return) {
				handleConfirmGitLogOption();
				return;
			}

			if (key.escape) {
				handleCloseGitLogHintBar();
				return;
			}

			if (input === '1') {
				handleSelectGitLogOption('default');
				return;
			}

			if (input === '2') {
				handleSelectGitLogOption('oneline');
				return;
			}

			if (key.leftArrow || key.upArrow || input === 'h' || input === 'k') {
				handleSelectGitLogOption('default');
				return;
			}

			if (key.rightArrow || key.downArrow || input === 'l' || input === 'j') {
				handleSelectGitLogOption('oneline');
				return;
			}

			return;
		}

		if (input === 'q' || key.escape) {
			exit();
			return;
		}

		if (input === 'p') {
			void handleGitPull();
			return;
		}

		if (input === 'r') {
			void handleGitRefresh();
			return;
		}

		if (focusedPane === 'text') {
			if (key.pageDown) {
				moveTextSelection(textPageSize);
				return;
			}

			if (key.pageUp) {
				moveTextSelection(-textPageSize);
				return;
			}

			if (key.home) {
				selectTextItemAtIndex(0);
				return;
			}

			if (key.end) {
				selectTextItemAtIndex(textItems.length - 1);
				return;
			}
		}

		if (input === 'd') {
			handleGitDiff();
			return;
		}

		if (input === 'b') {
			handleGitBranch();
			return;
		}

		if (input === 'l') {
			handleGitLog();
			return;
		}

		if (input === 's') {
			handleGitStatus();
			return;
		}

		if (input === 'x') {
			void handleGitPush();
		}
	}, [exit, focusedPane, handleCloseGitLogHintBar, handleConfirmGitLogOption, handleGitBranch, handleGitDiff, handleGitLog, handleGitPull, handleGitPush, handleGitRefresh, handleGitStatus, handleSelectGitLogOption, isGitLogHintBarOpen, moveTextSelection, selectTextItemAtIndex, textItems.length, textPageSize]);

	useInput(handleInput);

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
			<Text color="green">gitx</Text>
			<Text dimColor>
				DirectoryTextBrowserWithStatusBar rooted at /home/mpb/Documents/GitHub with live Git
				status, diff, branch, and log output per selected folder.
			</Text>
			<Text>
				Selected directory:{' '}
				{selectedDirectoryPath ? basename(selectedDirectoryPath) : basename(rootDirectory)}
			</Text>
			<Text dimColor>
				Selected entry: {selectedTextItem ? selectedTextItem.text : 'None'}
			</Text>

			<DirectoryTextBrowserWithStatusBar
				directoryPath={rootDirectory}
				getTextItems={getTextItems}
				width={browserWidth}
				height={browserHeight}
				selectedDirectoryPath={selectedDirectoryPath}
				onSelectDirectory={handleSelectDirectory}
				currentTextItemId={selectedTextItemId}
				selectedTextItemId={selectedTextItemId}
				onSelectTextItem={setSelectedTextItemId}
				focusedPane={focusedPane}
				onFocusPaneChange={setFocusedPane}
				directoryTitle="REPOSITORY"
				textTitle={textTitle}
				textPlaceholderText={textPlaceholderText}
				textEmptyText={textEmptyText}
				statusBarProps={{
					hints: primaryCommandStatusBarHints,
					status: gitCommandStatus,
					errorMessage: gitCommandErrorMessage
				}}
			/>
			{isGitLogHintBarOpen ? (
				<StatusBar hints={secondaryStatusBarHints} status="idle" width={browserWidth} />
			) : null}
		</Box>
	);
}
