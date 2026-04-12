import {
  DirectoryTextBrowser,
  DirectoryTextBrowserWithStatusBar,
  StatusBar,
} from '../src/pajussara-cdn';
import type {
  DirectoryTextBrowserProps,
  DirectoryTextBrowserPane,
  DirectoryTextBrowserWithStatusBarProps,
  StatusBarHint,
  StatusBarProps,
  TextListItem,
} from '../src/pajussara-cdn';

describe('pajussara-cdn exports', () => {
  it('should export DirectoryTextBrowser as a function or class', () => {
    expect(DirectoryTextBrowser).toBeDefined();
    expect(
      typeof DirectoryTextBrowser === 'function' ||
        typeof DirectoryTextBrowser === 'object'
    ).toBe(true);
  });

  it('should export DirectoryTextBrowserWithStatusBar as a function or class', () => {
    expect(DirectoryTextBrowserWithStatusBar).toBeDefined();
    expect(
      typeof DirectoryTextBrowserWithStatusBar === 'function' ||
        typeof DirectoryTextBrowserWithStatusBar === 'object'
    ).toBe(true);
  });

  it('should export StatusBar as a function or class', () => {
    expect(StatusBar).toBeDefined();
    expect(
      typeof StatusBar === 'function' || typeof StatusBar === 'object'
    ).toBe(true);
  });

  it('should allow usage of exported types without error', () => {
    // These are compile-time checks; this test is for type import coverage
    const props: DirectoryTextBrowserProps = {} as DirectoryTextBrowserProps;
    const pane: DirectoryTextBrowserPane = {} as DirectoryTextBrowserPane;
    const withStatusBarProps: DirectoryTextBrowserWithStatusBarProps =
      {} as DirectoryTextBrowserWithStatusBarProps;
    const statusBarHint: StatusBarHint = {} as StatusBarHint;
    const statusBarProps: StatusBarProps = {} as StatusBarProps;
    const textListItem: TextListItem = {} as TextListItem;

    expect(props).toBeDefined();
    expect(pane).toBeDefined();
    expect(withStatusBarProps).toBeDefined();
    expect(statusBarHint).toBeDefined();
    expect(statusBarProps).toBeDefined();
    expect(textListItem).toBeDefined();
  });

  it('should throw when importing a non-existent export', () => {
    // Simulate dynamic import error
    expect(() => {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { NotARealExport } = require('../src/pajussara-cdn');
    }).toThrow();
  });

  it('should not export any unexpected keys', () => {
    const exportedKeys = Object.keys(require('../src/pajussara-cdn'));
    expect(exportedKeys.sort()).toEqual(
      [
        'DirectoryTextBrowser',
        'DirectoryTextBrowserWithStatusBar',
        'StatusBar',
      ].sort()
    );
  });
});
