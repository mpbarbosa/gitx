import React from 'react';
import {jest} from '@jest/globals';

const mockExecFile = jest.fn();
const mockExecFileSync = jest.fn();
const mockReaddir = jest.fn();
const mockReaddirSync = jest.fn();
const mockJoin = jest.fn();
const mockBasename = jest.fn();

mockReaddir.mockResolvedValue([{isDirectory: () => true, name: 'repo1'}]);
mockJoin.mockImplementation((...args: string[]) => args.join('/'));
mockBasename.mockImplementation((targetPath: string) => targetPath.split('/').pop());
mockExecFile.mockImplementation(
	(
		_cmd: string,
		_args: string[],
		_options: unknown,
		callback: (error: Error | null, stdout: string, stderr: string) => void
	) => {
		const gitSubcommand = _args[0];

		if (gitSubcommand === 'status') {
			callback(null, '## main\n?? file.txt\n M changed.js\n', '');
			return;
		}

		if (gitSubcommand === 'diff') {
			callback(null, 'diff --git a/file b/file\n@@ -1,2 +1,2 @@\n+added\n-removed\n', '');
			return;
		}

		if (gitSubcommand === 'branch') {
			callback(null, '* main\n  dev\n', '');
			return;
		}

		if (gitSubcommand === 'log') {
			callback(null, 'commit abc123\nAuthor: Test\nDate: Today\n\nInitial commit\n', '');
			return;
		}

		callback(null, '', '');
	}
);
type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

jest.unstable_mockModule('node:child_process', () => ({
	execFileSync: mockExecFileSync,
	execFile: mockExecFile,
	default: {
		execFileSync: mockExecFileSync,
		execFile: mockExecFile
	}
}));

jest.unstable_mockModule('node:fs/promises', () => ({
	readdir: mockReaddir,
	default: {
		readdir: mockReaddir
	}
}));

jest.unstable_mockModule('node:fs', () => ({
	readdirSync: mockReaddirSync,
	default: {
		readdirSync: mockReaddirSync
	}
}));

jest.unstable_mockModule('node:path', () => ({
	join: mockJoin,
	basename: mockBasename,
	default: {
		join: mockJoin,
		basename: mockBasename
	}
}));

const {Text} = await import('ink');

jest.unstable_mockModule('../src/pajussara-cdn', () => ({
	DirectoryTextBrowserWithStatusBar: jest.fn(
		({
			getTextItems,
			textTitle,
			selectedDirectoryPath,
			statusBarProps
		}: {
			getTextItems: (directoryPath: string | null) => Array<{id: string; text: string}>;
			textTitle: string;
			selectedDirectoryPath: string | null;
			statusBarProps: {
				hints?: Array<{key: string; label: string}>;
				status?: string;
				errorMessage?: string | null;
			};
		}) => {
			const textItems = getTextItems(selectedDirectoryPath);

			return (
				<>
					<Text>DirectoryTextBrowserWithStatusBar</Text>
					<Text>{textTitle}</Text>
					<Text>{`Browser directory: ${selectedDirectoryPath ?? 'None'}`}</Text>
					<Text>{`Command status: ${statusBarProps.status ?? 'idle'}`}</Text>
					<Text>
						{`Primary hints: ${(statusBarProps.hints ?? [])
							.map((hint) => `${hint.key}:${hint.label}`)
							.join(' | ')}`}
					</Text>
					{textItems.map((item) => (
						<Text key={item.id}>{item.text}</Text>
					))}
					{statusBarProps.errorMessage ? <Text>{statusBarProps.errorMessage}</Text> : null}
				</>
			);
		}
	),
	StatusBar: jest.fn(
		({hints}: {hints: Array<{key: string; label: string}>}) => (
			<Text>{hints.map((hint) => `${hint.key}:${hint.label}`).join(' | ')}</Text>
		)
	)
}));

const {render} = await import('ink-testing-library');
const {App} = await import('../src/app');
const flushInput = async (cycles = 1) => {
	for (let index = 0; index < cycles; index += 1) {
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
};

async function renderApp() {
	const instance = render(<App />);
	await flushInput(4);
	return instance;
}

describe('App', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockReaddir.mockResolvedValue([{isDirectory: () => true, name: 'repo1'}]);
		mockJoin.mockImplementation((...args: string[]) => args.join('/'));
		mockBasename.mockImplementation((targetPath: string) => targetPath.split('/').pop());
		mockExecFile.mockImplementation(
			(
				_cmd: string,
				_args: string[],
				_options: unknown,
				callback: (error: null, stdout: string, stderr: string) => void
			) => {
				const gitSubcommand = _args[0];

				if (gitSubcommand === 'status') {
					callback(null, '## main\n?? file.txt\n M changed.js\n', '');
					return;
				}

				if (gitSubcommand === 'diff') {
					callback(null, 'diff --git a/file b/file\n@@ -1,2 +1,2 @@\n+added\n-removed\n', '');
					return;
				}

				if (gitSubcommand === 'branch') {
					callback(null, '* main\n  dev\n', '');
					return;
				}

				if (gitSubcommand === 'log') {
					callback(null, 'commit abc123\nAuthor: Test\nDate: Today\n\nInitial commit\n', '');
					return;
				}

				callback(null, '', '');
			}
		);
	});

	it('renders without crashing and shows the default status view', async () => {
		const {lastFrame} = await renderApp();

		expect(lastFrame()).toContain('gitx');
		expect(lastFrame()).toContain('DirectoryTextBrowserWithStatusBar');
		expect(lastFrame()).toContain('Selected directory: repo1');
		expect(lastFrame()).toContain('GIT STATUS');
	});

	it('does not fetch remotes while rendering the default status view', async () => {
		await renderApp();

		expect(mockExecFile).not.toHaveBeenCalledWith(
			'git',
			expect.arrayContaining(['fetch']),
			expect.anything()
		);
	});

	it('switches to the diff view from keyboard input', async () => {
		const instance = await renderApp();

		instance.stdin.write('d');
		await flushInput(4);

		expect(instance.lastFrame()).toContain('GIT DIFF');
	});

	it('switches to the branch view from keyboard input', async () => {
		const instance = await renderApp();

		instance.stdin.write('b');
		await flushInput(4);

		expect(instance.lastFrame()).toContain('GIT BRANCH');
	});

	it('opens the git log options and confirms the default log view', async () => {
		const instance = await renderApp();

		instance.stdin.write('l');
		await flushInput(2);
		expect(instance.lastFrame()).toContain('Enter:Run');
		instance.stdin.write('\r');
		await flushInput(4);

		expect(instance.lastFrame()).toContain('GIT LOG');
	});

	it('shows a friendly message when the selected folder is not a git repository', async () => {
		mockExecFile.mockImplementation((_cmd: string, args: string[], _options: unknown, callback: ExecFileCallback) => {
			if (args[0] === 'status') {
				const error = new Error('fatal: not a git repository') as Error & {stderr?: string};
				callback(error, '', 'fatal: not a git repository');
				return;
			}

			callback(null, '', '');
		});

		const {lastFrame} = await renderApp();

		expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
	});

	it('shows a fallback error message for unknown git failures', async () => {
		mockExecFile.mockImplementation((_cmd: string, args: string[], _options: unknown, callback: ExecFileCallback) => {
			if (args[0] === 'status') {
				callback(42 as unknown as Error, '', '');
				return;
			}

			callback(null, '', '');
		});

		const {lastFrame} = await renderApp();

		expect(lastFrame()).toContain('git status failed: Unknown git command error');
	});

	it('surfaces directory loading failures in the status area', async () => {
		mockReaddir.mockRejectedValueOnce(new Error('permission denied'));

		const {lastFrame} = await renderApp();

		expect(lastFrame()).toContain('Failed to load directories: permission denied');
	});

	it('runs git fetch --prune when pressing r', async () => {
		const instance = await renderApp();

		instance.stdin.write('r');
		await flushInput(2);

		expect(mockExecFile).toHaveBeenCalledWith(
			'git',
			['fetch', '--prune'],
			expect.objectContaining({
				cwd: '/home/mpb/Documents/GitHub/repo1',
				encoding: 'utf8'
			}),
			expect.any(Function)
		);
	});

	it('shows command feedback while git fetch --prune is running and after it completes', async () => {
		let completeCommand: ExecFileCallback | undefined;
		mockExecFile.mockImplementation(
			(_cmd: string, args: string[], _options: unknown, callback: ExecFileCallback) => {
				if (args[0] === 'fetch') {
					completeCommand = callback;
					return;
				}

				if (args[0] === 'status') {
					callback(null, '## main\n?? file.txt\n M changed.js\n', '');
					return;
				}

				callback(null, '', '');
			}
		);
		const instance = await renderApp();

		instance.stdin.write('r');
		await flushInput(2);

		expect(instance.lastFrame()).toContain('Command status: loading');
		expect(instance.lastFrame()).toContain('Run:git fetch --prune');

		completeCommand?.(null, '', '');
		await flushInput(4);

		expect(instance.lastFrame()).toContain('Command status: done');
		expect(instance.lastFrame()).toContain('Done:git fetch --prune');
	});

	it('clears command feedback when switching views', async () => {
		const instance = await renderApp();

		instance.stdin.write('r');
		await flushInput(4);
		expect(instance.lastFrame()).toContain('Done:git fetch --prune');

		instance.stdin.write('d');
		await flushInput(4);

		expect(instance.lastFrame()).toContain('Command status: idle');
		expect(instance.lastFrame()).not.toContain('Done:git fetch --prune');
	});
});
