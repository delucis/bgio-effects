import type { Game } from 'boardgame.io';
import { EffectsPlugin } from 'bgio-effects/plugin';

interface G {
  roll: number;
  score: number;
}

export const BaseGame: Game<G> = {
  setup: (): G => ({
    roll: 1,
    score: 0,
  }),
  moves: {
    roll: (G: G, ctx): void => {
      G.roll = ctx.random.D6();
      if (G.roll === 6) G.score++;
    },
  },
  endIf: (G: G): boolean => G.score >= 5,
};

const baseEffectsConfig = {
  effects: {
    roll: {
      create: (value) => value,
    },
  },
};

export const GameWithRollEffect: Game<G> = {
  ...BaseGame,
  plugins: [EffectsPlugin(baseEffectsConfig)],
  moves: {
    ...BaseGame.moves,
    roll: (G, ctx) => {
      G.roll = ctx.random.D6();
      ctx.effects.roll(G.roll);
      if (G.roll === 6) G.score++;
    },
  },
};

const timedEffectsConfig = {
  effects: {
    roll: {
      create: (value) => value,
      duration: 1,
    },
  },
};

export const GameWithTimedRollEffect: Game<G> = {
  ...BaseGame,
  plugins: [EffectsPlugin(timedEffectsConfig)],
  moves: {
    ...BaseGame.moves,
    roll: (G, ctx) => {
      G.roll = ctx.random.D6();
      ctx.effects.roll(G.roll);
      if (G.roll === 6) G.score++;
    },
  },
};
