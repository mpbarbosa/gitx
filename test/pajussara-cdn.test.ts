import {jest} from '@jest/globals';
import type {
	DirectoryTextBrowserPane,
	DirectoryTextBrowserProps,
	DirectoryTextBrowserWithStatusBarProps,
	StatusBarHint,
	StatusBarProps,
	TextListItem
} from '../src/pajussara-cdn';

const directoryTextBrowserMock = function DirectoryTextBrowser() {
	return null;
};

const directoryTextBrowserWithStatusBarMock = function DirectoryTextBrowserWithStatusBar() {
	return null;
};

const statusBarMock = function StatusBar() {
	return null;
};

jest.unstable_mockModule('#pajussara_tui_comp/DirectoryTextBrowser', () => ({
	DirectoryTextBrowser: directoryTextBrowserMock
}));

jest.unstable_mockModule('#pajussara_tui_comp/DirectoryTextBrowserWithStatusBar', () => ({
	DirectoryTextBrowserWithStatusBar: directoryTextBrowserWithStatusBarMock
}));

jest.unstable_mockModule('#pajussara_tui_comp/StatusBar', () => ({
	StatusBar: statusBarMock
}));

describe('pajussara-cdn exports', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('exports the expected runtime symbols', async () => {
		const pajussaraCdn = await import('../src/pajussara-cdn');

		expect(pajussaraCdn.DirectoryTextBrowser).toBe(directoryTextBrowserMock);
		expect(pajussaraCdn.DirectoryTextBrowserWithStatusBar).toBe(
			directoryTextBrowserWithStatusBarMock
		);
		expect(pajussaraCdn.StatusBar).toBe(statusBarMock);
	});

	it('does not expose unexpected runtime exports', async () => {
		const pajussaraCdn = await import('../src/pajussara-cdn');

		expect(Object.keys(pajussaraCdn).sort()).toEqual(
			['DirectoryTextBrowser', 'DirectoryTextBrowserWithStatusBar', 'StatusBar'].sort()
		);
		expect('NotARealExport' in pajussaraCdn).toBe(false);
	});

	it('allows the public type exports to be referenced', () => {
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
});
