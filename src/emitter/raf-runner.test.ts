import { RafRunner } from './raf-runner';

jest.useFakeTimers();

describe('RafRunner', () => {
  it('should start and stop', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    expect((runner as any).running).toBe(false);
    runner.start();
    expect((runner as any).running).toBe(true);
    runner.stop();
    expect((runner as any).running).toBe(false);
    jest.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call the callback', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    runner.start();
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    runner.stop();
  });

  it('should call the callback multiple times', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    runner.start();
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(2);
    runner.stop();
  });

  it('should not queue more tasks if start is called repeatedly', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    runner.start();
    runner.start();
    runner.start();
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    runner.stop();
  });
});
