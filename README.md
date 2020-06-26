# bgio-effects

> 📤 Helpers for managing state effects in [boardgame.io][bgio].

This package provides a structured approach to triggering ephemeral “effects” in game code that can be consumed from state on the client. It provides a game plugin and a React board wrapper, but you can also use the game plugin on its own, and consume the resulting state directly.

## Installation

```sh
npm install --save bgio-effects
```

## Usage

### Plugin

#### Configuration

The `bgio-effects` plugin needs a configuration object. This object cofigures the effects that will be available to your game logic.

```js
// effects-config.js

export const EffectsConfig = {
  // Declare the effect types you need.
  effects: {
    // Each effect is named by its key.
    // This creates a zero-config endTurn effect:
    endTurn: {},

    // Effects can declare a `create` function.
    // If defined, the return value of create will be
    // available as the payload for an effect.
    rollDie: {
      create: (value) => ({ value }),
    },
  },
};
```

#### Adding the plugin to your game

To use the plugin, include it in your game definition’s `plugins` array, passing it your configuration object:

```js
// game.js

import { EffectsPlugin } from 'bgio-effects';
import { EffectsConfig } from './effects-config';

const game = {
  name: 'my-game',

  plugins: [EffectsPlugin(EffectsConfig)],

  // Each effect type declared in your config will
  // be available in your moves as ctx.effects[effectType]
  moves: {
    roll: (G, ctx) => {
      G.roll = ctx.random.D6();
      ctx.effects.rollDie(G.roll);
    },

    end: (G, ctx) => {
      ctx.events.endTurn();
      ctx.effects.endTurn();
    },
  },
};
```

### Board wrapper

You can consume the plugin data directly from the game client by watching `props.plugins.effects.data`, but the provided board wrapper allows you to consume your effects as events instead:

```js
import React, { useCallback, useState } from 'react';
import { EffectsBoardWrapper, useEffectListener } from 'bgio-effects';

function MyBoard(props) {
  const [animate, setAnimate] = useState(false);

  // Create a handler for the effect you want to listen to.
  const onEndTurn = useCallback(() => {
    setAnimate(true);
    const timeout = window.setTimeout(() => setAnimate(false), 1000);
    // You can return a clean-up function if necessary
    return () => window.clearTimeout(timeout);
  }, [setAnimate]);

  // Subscribe to the “rollDie” effect type:
  useEffectListener('rollDie', onRoll);

  return <div className={animate ? 'animated-div' : 'div'}>{props.G.roll}</div>;
}

export const Board = EffectsBoardWrapper(MyBoard);
```

`bgio-effects` uses [`mitt`][mitt] internally, so you can also listen to all effects if you like:

```js
useEffectListener('*', callback);
```

## Why & What?

boardgame.io models game state as a plain Javascript object that is mutated by game actions — moves and events.

For example you might define a move to roll a die:

```js
function rollDie(G, ctx) {
  G.roll = ctx.random.D6();
}
```

When this move is used, the client can display the value of the rolled die by reading it from the game state object:

```js
function Board({ G }) {
  return <p>Die roll: {G.roll}</p>;
}
```

This declarative approach is pretty great, letting you write predictable UIs on top of game state. But what happens if a move doesn’t produce any state changes? What if the die roll matches the previous value? You probably want to show that the roll happened, even though the roll value in state didn’t change.

The solution is to store the state in a way that will show if it has been updated. The plugin this package provides allows you to store these move “effects” in a special part of your game state, letting you keep your `G` clean and declarative.

For example you could configure a `rollDie` effect to complement your move, and use it like this:

```js
function rollDie(G, ctx) {
  G.roll = ctx.random.D6();
  ctx.effects.rollDie(G.roll);
}
```

Now, if you roll a 6, your game state will look something like this:

```js
state = {
  G: { roll: 6 },
  ctx: {
    /* ... */
  },
  plugins: {
    effects: {
      data: {
        id: 'randomIDString',
        queue: [
          {
            type: 'rollDie',
            payload: { value: 6 },
          },
        ],
      },
    },
  },
};
```

The effects `queue` will only ever contain the values from the latest move or game event. And `effects.data.id` will be set to a unique string for every state update, making it easy to react to new effects.

[bgio]: https://boardgame.io/
[mitt]: https://github.com/developit/mitt
