import { Game, Ctx } from 'boardgame.io';
import { EffectsCtxMixin } from 'bgio-effects';
import { EffectsPlugin } from 'bgio-effects/plugin';

const effectsConfig = {
  effects: {
    A: {
      create: (arg: string) => arg,
      duration: 0.1,
    },
    B: {
      create: (arg: string) => arg,
      duration: 0.1,
    },
  },
} as const;

export type EffectsConfig = typeof effectsConfig;

const game: Game<
  Record<string, never>,
  Ctx & EffectsCtxMixin<EffectsConfig>
> = {
  plugins: [EffectsPlugin(effectsConfig)],
  moves: {
    One: (_, ctx) => {
      ctx.effects.A('one');
      ctx.effects.A('two', '>+0.4');
      ctx.effects.B('hello', '>+0.4');
      ctx.effects.A('three', '>+0.15');
      ctx.effects.B('world', '>+0.4');
    },
    Two: (_, ctx) => {
      ctx.effects.A('synch-');
      ctx.effects.B('ronise', '<');
      ctx.effects.A('effects', '>+0.4');
      ctx.effects.B('FX!', '<');
    },
  },
};

export default game;
