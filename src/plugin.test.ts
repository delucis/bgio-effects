import { Client } from 'boardgame.io/client';
import { Ctx, Game } from 'boardgame.io';
import { EffectsPluginConfig, EffectsCtxMixin } from './types';
import { EffectsPlugin } from './plugin';

const bgioPluginContext = { G: {}, ctx: {} as Ctx, game: {} };
const initPluginAPI = <C extends EffectsPluginConfig>(config: C) => {
  const p = EffectsPlugin<C>(config);
  return p.api?.({ ...bgioPluginContext, data: p.setup?.(bgioPluginContext) });
};

const config = {
  effects: {
    dumb: {},
    rollDie: {
      create: (roll: number) => ({ roll }),
    },
    alert: {
      duration: 0.2,
    },
  },
} as const;

describe('Plugin API', () => {
  test('basic initialisation', () => {
    const api = initPluginAPI({ effects: {} });
    const properties = Object.getOwnPropertyNames(api);
    const expectedProperties = ['timeline'];
    expect(properties).toEqual(expect.arrayContaining(expectedProperties));
    expect(properties).toHaveLength(expectedProperties.length);
  });

  test('initialisation with effect config', () => {
    const api = initPluginAPI(config);
    const properties = Object.getOwnPropertyNames(api);
    const expectedProperties = ['timeline', 'dumb', 'rollDie', 'alert'];
    expect(properties).toEqual(expect.arrayContaining(expectedProperties));
    expect(properties).toHaveLength(expectedProperties.length);
  });

  test('using effects', () => {
    const api = initPluginAPI(config);
    api.alert();
    api.dumb();
    api.rollDie(6);
    expect(api.timeline.getQueue()).toEqual([
      { t: 0, type: 'effects:start', endT: 0 },
      { t: 0, type: 'alert', endT: 0.2 },
      { t: 0.2, type: 'dumb', endT: 0.2 },
      { t: 0.2, type: 'rollDie', payload: { roll: 6 }, endT: 0.2 },
      { t: 0.2, type: 'effects:end', endT: 0.2 },
    ]);
    api.timeline.clear();
    expect(api.timeline.getQueue()).toEqual([
      { t: 0, type: 'effects:start', endT: 0 },
      { t: 0, type: 'effects:end', endT: 0 },
    ]);
  });

  test('flush', () => {
    const p = EffectsPlugin(config);
    const data = p.setup?.(bgioPluginContext);
    const api = p.api?.({ ...bgioPluginContext, data });
    api.alert();
    api.rollDie(6);
    const state = p.flush?.({ ...bgioPluginContext, data, api });
    expect(state).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^.{8}$/),
        queue: [
          { t: 0, endT: 0, type: 'effects:start' },
          { t: 0, endT: 0.2, type: 'alert' },
          { t: 0.2, endT: 0.2, type: 'rollDie', payload: { roll: 6 } },
          { t: 0.2, endT: 0.2, type: 'effects:end' },
        ],
      })
    );
  });

  describe('timeline methods', () => {
    test('isEmpty', () => {
      const api = initPluginAPI(config);
      expect(api.timeline.isEmpty()).toBe(true);
      api.alert();
      expect(api.timeline.isEmpty()).toBe(false);
    });

    test('duration', () => {
      const api = initPluginAPI(config);
      expect(api.timeline.duration()).toBe(0);
      api.alert();
      api.alert();
      expect(api.timeline.duration()).toBe(config.effects.alert.duration * 2);
    });
  });

  test('throws if an effect clashes with internal names', () => {
    const thrower = () => initPluginAPI({ effects: { timeline: {} } });
    expect(thrower).toThrow(
      'Cannot create effect type “timeline”. Name is reserved.'
    );
  });
});

describe('boardgame.io integration', () => {
  const game: Game<
    Record<string, never>,
    Ctx & EffectsCtxMixin<typeof config>
  > = {
    name: 'fx-test',

    plugins: [EffectsPlugin(config)],

    moves: {
      A: (_, ctx) => {
        ctx.effects.rollDie(5);
      },
      B: (_, ctx) => ctx.effects.dumb(),
    },

    turn: {
      onMove: (_, ctx) => ctx.effects.alert('^0', 0.5),
    },
  };

  const client = Client({ game: (game as unknown) as Game });

  test('setup', () => {
    expect(client.getState().plugins.effects.data).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^.{8}$/),
        queue: [
          { t: 0, endT: 0, type: 'effects:start' },
          { t: 0, endT: 0, type: 'effects:end' },
        ],
      })
    );
  });

  test('make move', () => {
    client.moves.A();
    expect(client.getState().plugins.effects.data).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^.{8}$/),
        queue: [
          { t: 0, endT: 0, type: 'effects:start' },
          { t: 0, endT: 0.5, type: 'alert' },
          { t: 0.5, endT: 0.5, type: 'rollDie', payload: { roll: 5 } },
          { t: 0.5, endT: 0.5, type: 'effects:end' },
        ],
      })
    );
  });

  test('make another move', () => {
    client.moves.B();
    expect(client.getState().plugins.effects.data).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^.{8}$/),
        queue: [
          { t: 0, endT: 0, type: 'effects:start' },
          { t: 0, endT: 0.5, type: 'alert' },
          { t: 0.5, endT: 0.5, type: 'dumb' },
          { t: 0.5, endT: 0.5, type: 'effects:end' },
        ],
      })
    );
  });
});
