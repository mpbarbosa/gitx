import {jest} from '@jest/globals';

const mockExecFile = jest.fn();
const mockExecFileSync = jest.fn();
const mockReaddir = jest.fn();
const mockJoin = jest.fn((...args: string[]) => args.join('/'));
const mockBasename = jest.fn(
	(targetPath: string) => targetPath.split('/').pop() ?? targetPath
);

type ExecFileCallback = (
	error: Error | null,
	stdout: string,
	stderr: string
) => void;

jest.unstable_mockModule('node:child_process', () => ({
	execFile: mockExecFile,
	execFileSync: mockExecFileSync,
	default: {
		execFile: mockExecFile,
		execFileSync: mockExecFileSync
	}
}));

jest.unstable_mockModule('node:fs/promises', () => ({
	readdir: mockReaddir,
	default: {
		readdir: mockReaddir
	}
}));

jest.unstable_mockModule('node:path', () => ({
	basename: mockBasename,
	join: mockJoin,
	default: {
		basename: mockBasename,
		join: mockJoin
	}
}));

jest.unstable_mockModule('../src/pajussara-cdn', () => ({
	DirectoryTextBrowserWithStatusBar: () => null,
	StatusBar: () => null
}));

const {appTestUtils} = await import('../src/app');

function mockGitResponses(
	responses: Record<
		string,
		{error?: Error | unknown; stdout?: string; stderr?: string}
	>
) {
	mockExecFile.mockImplementation(
		(
			_cmd: string,
			args: string[],
			_options: unknown,
			callback: ExecFileCallback
		) => {
			const response = responses[args[0] ?? ''] ?? {};
			callback(
				(response.error ?? null) as Error | null,
				response.stdout ?? '',
				response.stderr ?? ''
			);
		}
	);
}

describe('appTestUtils', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('formats command labels and normalizes output text', () => {
		expect(appTestUtils.formatGitCommandLabel(['fetch', '--prune'])).toBe(
			'git fetch --prune'
		);
		expect(appTestUtils.toUtf8Text('plain text')).toBe('plain text');
		expect(appTestUtils.toUtf8Text(Buffer.from('buffer text'))).toBe(
			'buffer text'
		);
	});

	it('extracts fallback and explicit error messages', () => {
		expect(appTestUtils.getErrorMessage(new Error('boom'), 'fallback')).toBe(
			'boom'
		);
		expect(appTestUtils.getErrorMessage('bad value', 'fallback')).toBe(
			'fallback'
		);
	});

	it('creates exec errors with attached stdout and stderr', () => {
		const execError = appTestUtils.createExecGitError(
			'oops',
			Buffer.from('hello'),
			'problem'
		);

		expect(execError.message).toBe('Unknown git command error');
		expect(execError.stdout).toBe('hello');
		expect(execError.stderr).toBe('problem');
	});

	it('builds git log option hints for each active selection', () => {
		expect(appTestUtils.getGitLogOptionHints('default')).toEqual([
			{key: '1', label: '> no command options'},
			{key: '2', label: '--oneline'},
			{key: 'Enter', label: 'Run'},
			{key: 'Esc', label: 'Cancel'}
		]);
		expect(appTestUtils.getGitLogOptionHints('oneline')).toEqual([
			{key: '1', label: 'no command options'},
			{key: '2', label: '> --oneline'},
			{key: 'Enter', label: 'Run'},
			{key: 'Esc', label: 'Cancel'}
		]);
	});

	it('maps git status, branch, diff, and log lines to text statuses', () => {
		expect(appTestUtils.getStatusFromLine('## main')).toBe('running');
		expect(appTestUtils.getStatusFromLine('?? file.txt')).toBe('pending');
		expect(appTestUtils.getStatusFromLine(' M file.txt')).toBe('done');
		expect(appTestUtils.getBranchStatusFromLine('* main')).toBe('running');
		expect(appTestUtils.getBranchStatusFromLine('  feature')).toBe('done');
		expect(appTestUtils.getDiffStatusFromLine('diff --git a/file b/file')).toBe(
			'running'
		);
		expect(appTestUtils.getDiffStatusFromLine('@@ -1 +1 @@')).toBe('pending');
		expect(appTestUtils.getDiffStatusFromLine('+added')).toBe('done');
		expect(appTestUtils.getDiffStatusFromLine('-removed')).toBe('error');
		expect(appTestUtils.getLogStatusFromLine('commit abc123')).toBe('running');
		expect(appTestUtils.getLogStatusFromLine('Author: Test')).toBe('pending');
		expect(appTestUtils.getLogStatusFromLine('message body')).toBe('done');
	});

	it('prefers stderr when building git error messages', () => {
		expect(appTestUtils.getGitErrorMessage({stderr: 'fatal: nope'})).toBe(
			'fatal: nope'
		);
		expect(
			appTestUtils.getGitErrorMessage({stderr: Buffer.from('fatal: buffer')})
		).toBe('fatal: buffer');
		expect(
			appTestUtils.getGitErrorMessage({stderr: '', message: 'ignored'})
		).toBe('Unknown git command error');
		expect(appTestUtils.getGitErrorMessage(new Error('fallback error'))).toBe(
			'fallback error'
		);
	});

	it('lists and sorts child directories', async () => {
		mockReaddir.mockResolvedValue([
			{isDirectory: () => true, name: 'zeta'},
			{isDirectory: () => false, name: 'README.md'},
			{isDirectory: () => true, name: 'alpha'}
		]);

		await expect(
			appTestUtils.getChildDirectories('/workspace')
		).resolves.toEqual(['/workspace/alpha', '/workspace/zeta']);
	});

	it('returns clean and fallback entries for git status', async () => {
		mockGitResponses({
			status: {
				stdout: ''
			}
		});

		await expect(appTestUtils.getGitStatusEntries('/repo')).resolves.toEqual([
			{id: '/repo:clean', text: 'Working tree clean.', status: 'done'}
		]);

		mockGitResponses({
			status: {
				error: new Error('status failed'),
				stderr: 'fatal: not a git repository'
			}
		});

		await expect(appTestUtils.getGitStatusEntries('/repo')).resolves.toEqual([
			{
				id: '/repo:not-a-git-repo',
				text: 'Info: This folder is not a Git repository.',
				status: 'pending'
			}
		]);

		mockGitResponses({
			status: {
				error: new Error('status failed'),
				stderr: 'fatal: unexpected'
			}
		});

		await expect(appTestUtils.getGitStatusEntries('/repo')).resolves.toEqual([
			{
				id: '/repo:error',
				text: 'git status failed: fatal: unexpected',
				status: 'error'
			}
		]);
	});

	it('returns clean and fallback entries for git diff, branch, and log views', async () => {
		mockGitResponses({
			diff: {stdout: ''},
			branch: {stdout: ''},
			log: {stdout: ''}
		});

		await expect(appTestUtils.getGitDiffEntries('/repo')).resolves.toEqual([
			{id: '/repo:clean-diff', text: 'No unstaged changes.', status: 'done'}
		]);
		await expect(appTestUtils.getGitBranchEntries('/repo')).resolves.toEqual([
			{id: '/repo:no-branches', text: 'No local branches.', status: 'pending'}
		]);
		await expect(appTestUtils.getGitLogEntries('/repo')).resolves.toEqual([
			{id: '/repo:empty-log', text: 'No commits found.', status: 'pending'}
		]);

		mockGitResponses({
			diff: {
				error: new Error('diff failed'),
				stderr: 'fatal: diff problem'
			},
			branch: {
				error: new Error('branch failed'),
				stderr: 'fatal: not a git repository'
			},
			log: {
				error: new Error('log failed'),
				stderr: 'fatal: not a git repository'
			}
		});

		await expect(appTestUtils.getGitDiffEntries('/repo')).resolves.toEqual([
			{
				id: '/repo:diff-error',
				text: 'git diff failed: fatal: diff problem',
				status: 'error'
			}
		]);
		await expect(appTestUtils.getGitBranchEntries('/repo')).resolves.toEqual([
			{
				id: '/repo:not-a-git-repo-branch',
				text: 'Info: This folder is not a Git repository.',
				status: 'pending'
			}
		]);
		await expect(appTestUtils.getGitLogEntries('/repo')).resolves.toEqual([
			{
				id: '/repo:not-a-git-repo-log',
				text: 'Info: This folder is not a Git repository.',
				status: 'pending'
			}
		]);
	});

	it('routes text-entry loading by view and builds loading labels', async () => {
		mockGitResponses({
			status: {stdout: '## main\n'},
			diff: {stdout: 'diff --git a/file b/file\n'},
			branch: {stdout: '* main\n'},
			log: {stdout: 'commit abc123\n'}
		});

		await expect(
			appTestUtils.getTextEntriesForView('status', '/repo')
		).resolves.toEqual([
			{id: '/repo:git-status:0', text: '## main', status: 'running'}
		]);
		await expect(
			appTestUtils.getTextEntriesForView('diff', '/repo')
		).resolves.toEqual([
			{
				id: '/repo:git-diff:0',
				text: 'diff --git a/file b/file',
				status: 'running'
			},
			{id: '/repo:git-diff:1', text: ' ', status: 'pending'}
		]);
		await expect(
			appTestUtils.getTextEntriesForView('branch', '/repo')
		).resolves.toEqual([
			{id: '/repo:git-branch:0', text: '* main', status: 'running'}
		]);
		await expect(
			appTestUtils.getTextEntriesForView('log', '/repo', ['--oneline'])
		).resolves.toEqual([
			{id: '/repo:git-log:0', text: 'commit abc123', status: 'running'},
			{id: '/repo:git-log:1', text: ' ', status: 'pending'}
		]);

		expect(appTestUtils.getTextLoadingLabel('status', '')).toBe(
			'Loading git status...'
		);
		expect(appTestUtils.getTextLoadingLabel('diff', '')).toBe(
			'Loading git diff...'
		);
		expect(appTestUtils.getTextLoadingLabel('branch', '')).toBe(
			'Loading git branch...'
		);
		expect(appTestUtils.getTextLoadingLabel('log', ' --oneline')).toBe(
			'Loading git log --oneline...'
		);
	});
});
