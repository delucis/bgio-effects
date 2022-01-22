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
    jest.advanceTimersToNextTimer();
    expect(callback).toHaveBeenCalledTimes(1);
    runner.stop();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('should call the callback multiple times', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    runner.start();
    jest.advanceTimersToNextTimer();
    expect(callback).toHaveBeenCalledTimes(1);
    jest.advanceTimersToNextTimer();
    expect(callback).toHaveBeenCalledTimes(2);
    runner.stop();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('should not queue more tasks if start is called repeatedly', () => {
    const callback = jest.fn();
    const runner = new RafRunner(callback);
    runner.start();
    runner.start();
    runner.start();
    // 2 timers get queued: 1 requestAnimationFrame and 1 setTimeout.
    expect(jest.getTimerCount()).toBe(2);
    jest.advanceTimersToNextTimer();
    expect(callback).toHaveBeenCalledTimes(1);
    runner.stop();
    expect(jest.getTimerCount()).toBe(0);
  });

  describe('when requestAnimationFrame doesn’t run', () => {
    let raf: jest.Mock;
    beforeEach(() => {
      raf = jest.fn();
      Object.defineProperty(window, 'requestAnimationFrame', {
        writable: true,
        value: raf,
      });
    });

    it('should call the callback', () => {
      const callback = jest.fn();
      const runner = new RafRunner(callback);
      runner.start();
      expect(raf).toHaveBeenCalledTimes(1);
      jest.advanceTimersToNextTimer();
      expect(raf).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledTimes(1);
      runner.stop();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should call the callback multiple times', () => {
      const callback = jest.fn();
      const runner = new RafRunner(callback);
      runner.start();
      expect(raf).toHaveBeenCalledTimes(1);
      jest.advanceTimersToNextTimer();
      expect(raf).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledTimes(1);
      jest.advanceTimersToNextTimer();
      expect(raf).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledTimes(2);
      runner.stop();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
