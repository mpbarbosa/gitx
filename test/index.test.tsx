import {jest} from '@jest/globals';

const renderMock = jest.fn();

describe('index.tsx', () => {
	const loadIndex = async () => {
		jest.resetModules();

		jest.unstable_mockModule('ink', () => ({
			render: renderMock
		}));

		jest.unstable_mockModule('../src/app.js', () => ({
			App: function App() {
				return null;
			}
		}));

		await import('../src/index');
	};

	beforeEach(() => {
		renderMock.mockReset();
		jest.clearAllMocks();
	});

	it('calls ink.render with App', async () => {
		await loadIndex();

		expect(renderMock).toHaveBeenCalledTimes(1);
		const callArg = renderMock.mock.calls[0]?.[0];
		expect(callArg?.type?.name || callArg?.type?.displayName || callArg?.type).toBe('App');
	});

	it('does not throw while rendering App', async () => {
		await expect(loadIndex()).resolves.toBeUndefined();
	});

	it('propagates render failures', async () => {
		renderMock.mockImplementation(() => {
			throw new Error('render failed');
		});

		await expect(loadIndex()).rejects.toThrow('render failed');
	});
});
