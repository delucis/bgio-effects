import { Timeline } from './timeline';
import type { Effect } from './types';

describe('construction', () => {
  test('creates an instance with expected methods', () => {
    const t = new Timeline();
    expect(typeof t.add).toBe('function');
    expect(typeof t.clear).toBe('function');
    expect(typeof t.getQueue).toBe('function');
  });
});

describe('#add', () => {
  const t = new Timeline();

  test('adds first data at 0s', () => {
    t.add({ type: 'test' });
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'effects:end' },
    ]);
  });

  test('adds data after duration', () => {
    t.add({ type: 'foo' }, '>', 5);
    t.add({ type: 'bar' }, '>', 5);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 10, type: 'effects:end' },
    ]);
  });

  test('adds data relative to end', () => {
    t.add({ type: 'baz' }, '>-1', 1);
    t.add({ type: 'bam' }, '>+0.5', 1);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 9, type: 'baz', duration: 1 },
      { t: 10.5, type: 'bam', duration: 1 },
      { t: 11.5, type: 'effects:end' },
    ]);
  });

  test('adds data relative to start of last effect', () => {
    t.add({ type: 'buq' }, '<-1', 2);
    t.add({ type: 'bup' }, '<+0.5', 2);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 9, type: 'baz', duration: 1 },
      { t: 9.5, type: 'buq', duration: 2 },
      { t: 10.5, type: 'bam', duration: 1 },
      { t: 11, type: 'bup', duration: 2 },
      { t: 13, type: 'effects:end' },
    ]);
  });

  test('adds data at an absolute time', () => {
    t.add({ type: 'fixed' }, 4);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 4, type: 'fixed', duration: 0 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 9, type: 'baz', duration: 1 },
      { t: 9.5, type: 'buq', duration: 2 },
      { t: 10.5, type: 'bam', duration: 1 },
      { t: 11, type: 'bup', duration: 2 },
      { t: 13, type: 'effects:end' },
    ]);
  });

  test('inserts data and shifts subsequent keyframes by duration', () => {
    t.add({ type: 'ins' }, '^10', 1);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 4, type: 'fixed', duration: 0 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 9, type: 'baz', duration: 1 },
      { t: 9.5, type: 'buq', duration: 2 },
      { t: 10, type: 'ins', duration: 1 },
      { t: 11.5, type: 'bam', duration: 1 },
      { t: 12, type: 'bup', duration: 2 },
      { t: 14, type: 'effects:end' },
    ]);
  });

  test('inserts data and shifts subsequent keyframes by offset', () => {
    t.add({ type: 'uns' }, '^11->0.5', 1);
    const queue = t.getQueue();
    expect(queue).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'test', duration: 0 },
      { t: 0, type: 'foo', duration: 5 },
      { t: 4, type: 'fixed', duration: 0 },
      { t: 5, type: 'bar', duration: 5 },
      { t: 9, type: 'baz', duration: 1 },
      { t: 9.5, type: 'buq', duration: 2 },
      { t: 10, type: 'ins', duration: 1 },
      { t: 11, type: 'uns', duration: 1 },
      { t: 12, type: 'bam', duration: 1 },
      { t: 12.5, type: 'bup', duration: 2 },
      { t: 14.5, type: 'effects:end' },
    ]);
  });

  test('inserts into an empty timeline', () => {
    const t = new Timeline();
    t.add({ type: 'nu' }, '^', 1);
    t.add({ type: 'bu' });
    expect(t.getQueue()).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'nu', duration: 1 },
      { t: 1, type: 'bu', duration: 0 },
      { t: 1, type: 'effects:end' },
    ]);
  });

  test('adds at start of last effect with empty timeline', () => {
    const t = new Timeline();
    t.add({ type: 'e' }, '<', 1);
    t.add({ type: 'mc' });
    expect(t.getQueue()).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'e', duration: 1 },
      { t: 1, type: 'mc', duration: 0 },
      { t: 1, type: 'effects:end' },
    ]);
  });

  test('throws if passed a badly formatted position string', () => {
    let thrower = () => t.add({ type: 'err' }, '78');
    expect(thrower).toThrow('Couldn’t parse position argument “78”');
    thrower = () => t.add({ type: 'err' }, '');
    expect(thrower).toThrow('Couldn’t parse position argument “”');
    thrower = () => t.add({ type: 'err' }, '->');
    expect(thrower).toThrow('Couldn’t parse position argument “->”');
  });
});

describe('#isEmpty', () => {
  const t = new Timeline();

  test('returns true for an empty timeline', () => {
    expect(t.isEmpty()).toBe(true);
  });

  test('returns false for a timeline with entries', () => {
    t.add({} as Effect);
    expect(t.isEmpty()).toBe(false);
  });

  test('returns true after clearing the timeline', () => {
    t.clear();
    expect(t.isEmpty()).toBe(true);
  });
});

describe('#duration', () => {
  const t = new Timeline();

  test('returns 0 for an empty timeline', () => {
    expect(t.duration()).toBe(0);
  });

  test('returns the total duration', () => {
    t.add({} as Effect, '>', 1);
    t.add({} as Effect, '>', 1);
    expect(t.duration()).toBe(2);
  });
});

describe('#clear', () => {
  test('deletes all timeline entries', () => {
    const t = new Timeline();
    t.add({ type: 'a' }, '>', 1);
    t.add({ type: 'b' }, '>', 1);
    expect(t.getQueue()).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'a', duration: 1 },
      { t: 1, type: 'b', duration: 1 },
      { t: 2, type: 'effects:end' },
    ]);
    t.clear();
    expect(t.getQueue()).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'effects:end' },
    ]);
    t.add({ type: 'a' }, '>', 1);
    expect(t.getQueue()).toEqual([
      { t: 0, type: 'effects:start' },
      { t: 0, type: 'a', duration: 1 },
      { t: 1, type: 'effects:end' },
    ]);
  });
});
