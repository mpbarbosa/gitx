import React from 'react';
import {jest} from '@jest/globals';

const mockExecFileSync = jest.fn();
const mockExecFile = jest.fn();
const mockReaddirSync = jest.fn();
const mockJoin = jest.fn();
const mockBasename = jest.fn();

mockReaddirSync.mockReturnValue([{isDirectory: () => true, name: 'repo1'}]);
mockJoin.mockImplementation((...args: string[]) => args.join('/'));
mockBasename.mockImplementation((targetPath: string) => targetPath.split('/').pop());
mockExecFile.mockImplementation(
	(
		_cmd: string,
		_args: string[],
		_options: unknown,
		callback: (error: null, stdout: string, stderr: string) => void
	) => callback(null, '', '')
);
type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;
mockExecFileSync.mockImplementation((_cmd: string, args: string[]) => {
	if (args[0] === 'status') return '## main\n?? file.txt\n M changed.js\n';
	if (args[0] === 'diff') return 'diff --git a/file b/file\n@@ -1,2 +1,2 @@\n+added\n-removed\n';
	if (args[0] === 'branch') return '* main\n  dev\n';
	if (args[0] === 'log') return 'commit abc123\nAuthor: Test\nDate: Today\n\nInitial commit\n';
	return '';
});

jest.unstable_mockModule('node:child_process', () => ({
	execFileSync: mockExecFileSync,
	execFile: mockExecFile,
	default: {
		execFileSync: mockExecFileSync,
		execFile: mockExecFile
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
const flushInput = async () => new Promise((resolve) => setTimeout(resolve, 0));

describe('App', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockReaddirSync.mockReturnValue([{isDirectory: () => true, name: 'repo1'}]);
		mockJoin.mockImplementation((...args: string[]) => args.join('/'));
		mockBasename.mockImplementation((targetPath: string) => targetPath.split('/').pop());
		mockExecFile.mockImplementation(
			(
				_cmd: string,
				_args: string[],
				_options: unknown,
				callback: (error: null, stdout: string, stderr: string) => void
			) => callback(null, '', '')
		);
		mockExecFileSync.mockImplementation((_cmd: string, args: string[]) => {
			if (args[0] === 'status') return '## main\n?? file.txt\n M changed.js\n';
			if (args[0] === 'diff') {
				return 'diff --git a/file b/file\n@@ -1,2 +1,2 @@\n+added\n-removed\n';
			}
			if (args[0] === 'branch') return '* main\n  dev\n';
			if (args[0] === 'log') return 'commit abc123\nAuthor: Test\nDate: Today\n\nInitial commit\n';
			return '';
		});
	});

	it('renders without crashing and shows the default status view', () => {
		const {lastFrame} = render(<App />);

		expect(lastFrame()).toContain('gitx');
		expect(lastFrame()).toContain('DirectoryTextBrowserWithStatusBar');
		expect(lastFrame()).toContain('Selected directory: repo1');
		expect(lastFrame()).toContain('GIT STATUS');
	});

	it('does not fetch remotes while rendering the default status view', () => {
		render(<App />);

		expect(mockExecFileSync).not.toHaveBeenCalledWith(
			'git',
			expect.arrayContaining(['fetch']),
			expect.anything()
		);
	});

	it('switches to the diff view from keyboard input', async () => {
		const instance = render(<App />);

		instance.stdin.write('d');
		await flushInput();

		expect(instance.lastFrame()).toContain('GIT DIFF');
	});

	it('switches to the branch view from keyboard input', async () => {
		const instance = render(<App />);

		instance.stdin.write('b');
		await flushInput();

		expect(instance.lastFrame()).toContain('GIT BRANCH');
	});

	it('opens the git log options and confirms the default log view', async () => {
		const instance = render(<App />);

		instance.stdin.write('l');
		await flushInput();
		expect(instance.lastFrame()).toContain('Enter:Run');
		instance.stdin.write('\r');
		await flushInput();

		expect(instance.lastFrame()).toContain('GIT LOG');
	});

	it('shows a friendly message when the selected folder is not a git repository', () => {
		mockExecFileSync.mockImplementation((_cmd: string, args: string[]) => {
			if (args[0] === 'status') {
				const error = new Error('fatal: not a git repository') as Error & {stderr?: string};
				error.stderr = 'fatal: not a git repository';
				throw error;
			}

			return '';
		});

		const {lastFrame} = render(<App />);

		expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
	});

	it('shows a fallback error message for unknown git failures', () => {
		mockExecFileSync.mockImplementation((_cmd: string, args: string[]) => {
			if (args[0] === 'status') {
				throw 42;
			}

			return '';
		});

		const {lastFrame} = render(<App />);

		expect(lastFrame()).toContain('git status failed: Unknown git command error');
	});

	it('runs git fetch --prune when pressing r', async () => {
		const instance = render(<App />);

		instance.stdin.write('r');
		await flushInput();

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
		mockExecFile.mockImplementationOnce(
			(
				_cmd: string,
				_args: string[],
				_options: unknown,
				callback: ExecFileCallback
			) => {
				completeCommand = callback;
			}
		);
		const instance = render(<App />);

		instance.stdin.write('r');
		await flushInput();

		expect(instance.lastFrame()).toContain('Command status: loading');
		expect(instance.lastFrame()).toContain('Run:git fetch --prune');

		completeCommand?.(null, '', '');
		await flushInput();

		expect(instance.lastFrame()).toContain('Command status: done');
		expect(instance.lastFrame()).toContain('Done:git fetch --prune');
	});

	it('clears command feedback when switching views', async () => {
		const instance = render(<App />);

		instance.stdin.write('r');
		await flushInput();
		expect(instance.lastFrame()).toContain('Done:git fetch --prune');

		instance.stdin.write('d');
		await flushInput();

		expect(instance.lastFrame()).toContain('Command status: idle');
		expect(instance.lastFrame()).not.toContain('Done:git fetch --prune');
	});
});
