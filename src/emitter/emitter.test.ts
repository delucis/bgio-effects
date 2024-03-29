import type { Ctx, Game } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import type { EffectsCtxMixin } from '..';
import { EffectsPlugin } from '../plugin';
import { EffectsEmitter } from '.';

const config = {
  effects: {
    longEffect: {
      duration: 0.8,
      create: (str: string) => str,
    },
    shortEffect: {
      duration: 0.1,
      create: (str: string) => str,
    },
  },
} as const;

enum GVal {
  'simple' = 'simple',
  'wEffects' = 'wEffects',
  'repeatEffects' = 'repeatEffects',
}

type G = { val?: GVal };

const game: Game<G, Ctx & EffectsCtxMixin<typeof config>> = {
  plugins: [EffectsPlugin(config)],
  moves: {
    simple(G) {
      G.val = GVal.simple;
    },
    wEffects(G, ctx) {
      G.val = GVal.wEffects;
      ctx.effects.longEffect('1');
      ctx.effects.shortEffect('2');
    },
    repeatEffects(G, ctx) {
      G.val = GVal.repeatEffects;
      ctx.effects.shortEffect('2');
      ctx.effects.shortEffect('2');
    },
  },
};

/**
 * Run a callback on an interval and resolve when it returns `true`.
 * @param condition Callback that should eventually return `true`.
 * @param interval Interval on which to test the condition callback (in ms).
 * @param timeout How long to wait for the condition to be `true` before rejecting (in ms).
 */
const waitFor = (condition: () => boolean, interval = 50, timeout = 1000) =>
  new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const intervalID = setInterval(checkCondition, interval);
    checkCondition();
    function checkCondition() {
      if (condition()) {
        clearInterval(intervalID);
        resolve();
      } else if (Date.now() > startTime + timeout) {
        clearInterval(intervalID);
        reject();
      }
    }
  });

describe('EffectsEmitter', () => {
  let client: ReturnType<typeof Client>;
  let emitter: ReturnType<typeof EffectsEmitter>;

  beforeEach(() => {
    client = Client({ game: game as unknown as Game });
    emitter = EffectsEmitter(client);
    client.start();
  });

  describe('#on()', () => {
    test('effect callbacks are called when a move is made', async () => {
      const longListener = jest.fn();
      const shortListener = jest.fn();

      emitter.on('longEffect', longListener);
      emitter.on('shortEffect', shortListener);

      client.moves.wEffects();
      await waitFor(() => emitter.size.get() === 0);

      expect(longListener).toHaveBeenCalledTimes(1);
      expect(longListener).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ G: { val: GVal.wEffects } })
      );
      expect(shortListener).toHaveBeenCalledTimes(1);
      expect(shortListener).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({ G: { val: GVal.wEffects } })
      );
    });

    test('onEnd callbacks are called when a move is made', async () => {
      const listener = jest.fn();
      emitter.on('longEffect', () => {}, listener);
      client.moves.wEffects();
      await waitFor(() => emitter.size.get() === 0);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('an "effects:start" callback is called', async () => {
      const listener = jest.fn();
      emitter.on('effects:start', listener);
      client.moves.simple();
      await waitFor(() => emitter.size.get() === 0);
      expect(listener).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ G: { val: GVal.simple } })
      );
    });

    test('an "effects:end" callback is called', async () => {
      const listener = jest.fn();
      emitter.on('effects:end', listener);
      client.moves.simple();
      await waitFor(() => emitter.size.get() === 0);
      expect(listener).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ G: { val: GVal.simple } })
      );
    });

    describe('returned unsubscribe function', () => {
      test('a removed callback is not called', async () => {
        const listener = jest.fn();
        const unsub = emitter.on('longEffect', listener);
        unsub();
        client.moves.wEffects();
        await waitFor(() => emitter.size.get() === 0);
        expect(listener).not.toHaveBeenCalled();
      });

      test('a removed onEnd callback is not called', async () => {
        const onStart = () => {};
        const onEnd = jest.fn();
        const unsub = emitter.on('longEffect', onStart, onEnd);
        unsub();
        client.moves.wEffects();
        await waitFor(() => emitter.size.get() === 0);
        expect(onEnd).not.toHaveBeenCalled();
      });
    });
  });

  describe('#clear()', () => {
    test('it prevents any effects from running and empties the queue', async () => {
      const longListener = jest.fn();
      emitter.on('longEffect', longListener);
      client.moves.wEffects();
      emitter.clear();
      await waitFor(() => emitter.size.get() === 0);
      expect(longListener).not.toHaveBeenCalled();
    });
  });

  describe('#flush()', () => {
    test('it emits all effects and empties the queue', () => {
      const onStart = jest.fn();
      const onEnd = jest.fn();
      emitter.on('effects:start', onStart, onEnd);
      emitter.on('longEffect', onStart, onEnd);
      emitter.on('shortEffect', onStart, onEnd);
      emitter.on('effects:end', onStart, onEnd);
      client.moves.wEffects();
      emitter.flush();
      expect(onStart).toHaveBeenCalledTimes(4);
      expect(onEnd).toHaveBeenCalledTimes(4);
    });
  });

  describe('#size', () => {
    test('it returns the number of effects in the queue', () => {
      expect(emitter.size.get()).toBe(0);
      client.moves.wEffects();
      expect(emitter.size.get()).toBe(4);
    });

    test('a subscriber receives the latest queue size', async () => {
      const listener = jest.fn();
      const unsubscribe = emitter.size.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(0);
      client.moves.simple();
      await waitFor(() => emitter.size.get() === 0);
      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenCalledWith(2);
      expect(listener).toHaveBeenLastCalledWith(0);
      unsubscribe();
    });
  });

  describe('#state', () => {
    test('it returns the current state of the game', async () => {
      expect(emitter.state.get()).toEqual(client.getState());
      client.moves.wEffects();
      await waitFor(() => emitter.size.get() < 4);
      expect(emitter.state.get()).toEqual(client.getState());
    });

    test('it can be updated after effects complete', async () => {
      emitter = EffectsEmitter(client, { updateStateAfterEffects: true });
      const initialState = client.getState();
      expect(emitter.state.get()).toEqual(initialState);
      client.moves.wEffects();
      await waitFor(() => emitter.size.get() < 4);
      expect(emitter.state.get()).toEqual(initialState);
      await waitFor(() => emitter.size.get() === 0);
      expect(emitter.state.get()).toEqual(client.getState());
    });

    test('a subscriber receives the latest state', async () => {
      const listener = jest.fn();
      const unsubscribe = emitter.state.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(client.getState());
      client.moves.simple();
      await waitFor(() => emitter.size.get() === 0);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(client.getState());
      unsubscribe();
    });
  });

  describe('internals', () => {
    test('the raf stops running once all effects are dealt with', async () => {
      await waitFor(() => emitter.size.get() === 0);
      expect((emitter as any).raf.running).toBe(false);
    });

    test('doesn’t throw while boardgame.io is loading state', () => {
      expect(() => (emitter as any).onUpdate(null)).not.toThrow();
    });

    test('doesn’t throw if used with a game missing the effects plugin', () => {
      expect(() => EffectsEmitter(Client({ game: {} }))).not.toThrow();
    });

    test('only emits effects for a given state update once', async () => {
      const listener = jest.fn();
      emitter.on('effects:start', listener);
      client.moves.simple();
      await waitFor(() => emitter.size.get() === 0);
      (emitter as any).onUpdate(client.getState());
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
