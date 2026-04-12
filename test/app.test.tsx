import React from 'react';
import {render, act} from 'ink-testing-library';
import {App} from '../src/app';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('node:path');
jest.mock('../src/pajussara-cdn', () => ({
  DirectoryTextBrowserWithStatusBar: jest.fn(({children}) => <div>{children}</div>),
  StatusBar: jest.fn(({children}) => <div>{children}</div>)
}));

const mockExecFileSync = childProcess.execFileSync as jest.Mock;
const mockReaddirSync = fs.readdirSync as jest.Mock;
const mockJoin = path.join as jest.Mock;
const mockBasename = path.basename as jest.Mock;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: one directory in root
    mockReaddirSync.mockReturnValue([
      {isDirectory: () => true, name: 'repo1'}
    ]);
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockBasename.mockImplementation((p) => p.split('/').pop());
    // Default git status
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'fetch') return '';
      if (args[0] === 'status') return '## main\n?? file.txt\n M changed.js\n';
      if (args[0] === 'diff') return 'diff --git a/file b/file\n@@ -1,2 +1,2 @@\n+added\n-removed\n';
      if (args[0] === 'branch') return '* main\n  dev\n';
      if (args[0] === 'log') return 'commit abc123\nAuthor: Test\nDate: Today\n\nInitial commit\n';
      return '';
    });
  });

  it('renders without crashing and shows main UI elements', () => {
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('gitx');
    expect(lastFrame()).toContain('DirectoryTextBrowserWithStatusBar');
    expect(lastFrame()).toContain('Selected directory: repo1');
  });

  it('shows correct selected entry text', () => {
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('Selected entry: None');
  });

  it('handles empty directory list gracefully', () => {
    mockReaddirSync.mockReturnValue([]);
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('Selected directory: GitHub');
  });

  it('handles getGitStatusEntries happy path', () => {
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('GIT STATUS');
  });

  it('handles getGitStatusEntries not a git repo error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'fetch' || args[0] === 'status') {
        const err: any = new Error('fatal: not a git repository');
        err.stderr = 'fatal: not a git repository';
        throw err;
      }
      return '';
    });
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
  });

  it('handles getGitStatusEntries generic error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'fetch' || args[0] === 'status') {
        const err: any = new Error('some git error');
        err.stderr = 'some git error';
        throw err;
      }
      return '';
    });
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('git status failed: some git error');
  });

  it('handles getGitDiffEntries happy path', () => {
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('GIT STATUS');
    // Simulate pressing 'd' for diff
    act(() => {
      process.stdin.emit('data', 'd');
    });
    expect(lastFrame()).toContain('GIT DIFF');
  });

  it('handles getGitDiffEntries not a git repo error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'diff') {
        const err: any = new Error('fatal: not a git repository');
        err.stderr = 'fatal: not a git repository';
        throw err;
      }
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'd');
    });
    expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
  });

  it('handles getGitBranchEntries happy path', () => {
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'b');
    });
    expect(lastFrame()).toContain('GIT BRANCH');
  });

  it('handles getGitBranchEntries not a git repo error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'branch') {
        const err: any = new Error('fatal: not a git repository');
        err.stderr = 'fatal: not a git repository';
        throw err;
      }
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'b');
    });
    expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
  });

  it('handles getGitLogEntries happy path', () => {
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'l');
    });
    expect(lastFrame()).toContain('GIT LOG');
  });

  it('handles getGitLogEntries not a git repo error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'log') {
        const err: any = new Error('fatal: not a git repository');
        err.stderr = 'fatal: not a git repository';
        throw err;
      }
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'l');
    });
    expect(lastFrame()).toContain('Info: This folder is not a Git repository.');
  });

  it('handles quitting the app with "q"', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => {
      const {stdin} = render(<App />);
      act(() => {
        stdin.write('q');
      });
    }).toThrow('exit');
    exitSpy.mockRestore();
  });

  it('handles quitting the app with Escape', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => {
      const {stdin} = render(<App />);
      act(() => {
        stdin.write('\x1b');
      });
    }).toThrow('exit');
    exitSpy.mockRestore();
  });

  it('handles edge case: no selected directory', () => {
    mockReaddirSync.mockReturnValue([]);
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('Selected directory: GitHub');
  });

  it('handles edge case: empty git status output', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'fetch') return '';
      if (args[0] === 'status') return '';
      return '';
    });
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('Working tree clean.');
  });

  it('handles edge case: empty git diff output', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'diff') return '\n\n';
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'd');
    });
    expect(lastFrame()).toContain('No unstaged changes.');
  });

  it('handles edge case: empty git branch output', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'branch') return '';
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'b');
    });
    expect(lastFrame()).toContain('No local branches.');
  });

  it('handles edge case: empty git log output', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'log') return '\n\n';
      return '';
    });
    const {lastFrame} = render(<App />);
    act(() => {
      process.stdin.emit('data', 'l');
    });
    expect(lastFrame()).toContain('No commits found.');
  });

  it('handles error in getGitErrorMessage with unknown error', () => {
    mockExecFileSync.mockImplementation((cmd, args, opts) => {
      if (args[0] === 'status') throw 42;
      return '';
    });
    const {lastFrame} = render(<App />);
    expect(lastFrame()).toContain('git status failed: Unknown git command error');
  });
});
