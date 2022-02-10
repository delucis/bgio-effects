---
title: Plugin Configuration
description: How to configure the bgio-effects game plugin and add it to a boardgame.io game definition.
layout: layout:MainLayout
---

The `bgio-effects` plugin needs a configuration object. This object configures
the effects that will be available to your game logic.

```js
// effects-config.js

export const config = {
  // Declare the effect types you need.
  effects: {
    // Each effect is named by its key.
    // This creates a zero-config endTurn effect:
    endTurn: {},

    rollDie: {
      // Effects can declare a `create` function.
      // If defined, the return value of create will be
      // available as the payload for an effect.
      create: (value) => ({ value }),

      // Effects can declare a default duration in seconds
      // (see “Sequencing effects” guide for details).
      duration: 2,
    },
  },
};
```

## Adding the plugin to your game

To use the plugin, include it in your game definition’s `plugins` array,
passing it your configuration object:

```js
// game.js

import { EffectsPlugin } from 'bgio-effects/plugin';
import { config } from './effects-config';

const game = {
  name: 'my-game',

  plugins: [EffectsPlugin(config)],

  // Each effect type declared in your config will
  // be available in your moves as ctx.effects[effectType]
  moves: {
    roll: (G, ctx) => {
      const roll = ctx.random.D6();
      ctx.effects.rollDie(roll);
      if (roll > 4) ctx.effects.explode();
      G.roll = roll;
    },

    end: (G, ctx) => {
      ctx.events.endTurn();
      ctx.effects.endTurn();
    },
  },
};
```
