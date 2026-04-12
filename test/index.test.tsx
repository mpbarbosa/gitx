import * as ink from 'ink';

jest.mock('ink', () => ({
  render: jest.fn()
}));

jest.mock('../src/app', () => ({
  App: () => null
}));

describe('index.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should call ink.render with <App />', () => {
    require('../src/index');
    expect(ink.render).toHaveBeenCalledTimes(1);
    const callArg = (ink.render as jest.Mock).mock.calls[0][0];
    expect(callArg.type.name || callArg.type.displayName || callArg.type).toBe('App');
  });

  it('should not throw when rendering App', () => {
    expect(() => {
      require('../src/index');
    }).not.toThrow();
  });

  it('should handle error if render throws', () => {
    (ink.render as jest.Mock).mockImplementation(() => {
      throw new Error('render failed');
    });
    expect(() => {
      require('../src/index');
    }).toThrow('render failed');
  });
});
