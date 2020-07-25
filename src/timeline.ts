import type { Queue, Effect, EffectsPluginConfig, TimingParams } from './types';

const float = '(?:\\d*\\.?\\d+|\\d+\\.?\\d*)?';
const insertPositionRE = RegExp(`^\\^(${float})(->(${float})?)?$`);
const parseInsertPosition = (position: string) => {
  const matches = insertPositionRE.exec(position);
  return {
    position: matches && matches[1] ? parseFloat(matches[1]) : 0,
    shift: matches && matches[3] ? parseFloat(matches[3]) : undefined,
  };
};

/**
 * Timeline that allows adding data and returning an ordered queue of
 * data by timestamp.
 */
export class Timeline<E extends EffectsPluginConfig['effects']> {
  private _last: null | number;
  private _keyframes: Map<number, Effect<E>[]>;
  private _duration: number;

  constructor() {
    this._last = null;
    this._keyframes = new Map();
    this._duration = 0;
  }

  /**
   * True when the timeline has no entries.
   */
  isEmpty(): boolean {
    return this._keyframes.size === 0;
  }

  /**
   * The total duration of the current timeline.
   */
  duration(): number {
    return this._duration;
  }

  /**
   * Get a sorted array of keyframe keys.
   */
  private keys() {
    return [...this._keyframes.keys()].sort((t1, t2) => (t1 < t2 ? -1 : 1));
  }

  /**
   * Shift keyframes along the timeline.
   * @param amount Amount of time to shift keyframes by.
   * @param start  Start shifting keyframes after this time.
   */
  private shift(amount: number, start: number): void {
    const keys = this.keys();
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (key >= start) {
        const effects = this._keyframes.get(key)!;
        this._keyframes.delete(key);
        this._keyframes.set(key + amount, effects);
      }
    }
    if (this._last) this._last += amount;
    if (this._duration) this._duration += amount;
  }

  /**
   * Add data to the timeline.
   * @param effect     Effect data to add to the timeline.
   * @param position Position of the effect on the timeline.
   *                 - Number places the effect at an absolute time in seconds, e.g. 3
   *                 - '<': relative to start of last effect in timeline, e.g. '<-1', '<+0.5'
   *                 - '>': relative to end of timeline, e.g. '>+2', '>-0.2'
   *                 - '^': insert at absolute time & shift following events, e.g. '^2->0.5'
   * @param duration Duration of the effect when played back.
   */
  add(
    effect: Effect<E>,
    position: TimingParams[0] = this._duration,
    duration: TimingParams[1] = 0
  ): void {
    let shift: number | undefined;

    if (typeof position === 'string') {
      position = position.trim();
      const startChar = position.slice(0, 1);
      const isLessThan = startChar === '<';
      if (isLessThan || startChar === '>') {
        const reference = isLessThan ? this._last || 0 : this._duration;
        const offset = parseFloat(position.slice(1) || '0');
        position = reference + offset;
      } else if (startChar === '^') {
        ({ position, shift } = parseInsertPosition(position));
        if (shift === undefined) shift = duration;
      }
    }

    if (typeof position !== 'number') {
      throw new Error(`Couldn’t parse position argument “${position}”`);
    }

    if (shift) {
      this.shift(shift, position);
    }

    const entries = this._keyframes.get(position) || [];
    this._keyframes.set(position, [...entries, effect]);

    if (this._last === null || position > this._last) {
      this._last = position;
    }
    if (position + duration > this._duration) {
      this._duration = position + duration;
    }
  }

  /**
   * Get a simple representation of the current queue.
   * @return Sorted array of effects.
   *         Each effect has a property `t` specifying its time on the timeline.
   */
  getQueue(): Queue<E> {
    let queue: Queue<E> = [];
    this._keyframes.forEach((effects, t) => {
      effects.forEach((data) => {
        queue.push({ t, ...(data as object) } as Queue<E>[number]);
      });
    });
    queue.sort(({ t: t1 }, { t: t2 }) => {
      return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
    });
    return queue;
  }

  /**
   * Clear the timeline, removing all effects.
   */
  clear(): void {
    this._last = null;
    this._keyframes.clear();
    this._duration = 0;
  }
}
