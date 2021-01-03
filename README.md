# bgio-effects

[![NPM Version](https://img.shields.io/npm/v/bgio-effects)](https://www.npmjs.com/package/bgio-effects)
[![Build Status](https://travis-ci.com/delucis/bgio-effects.svg?branch=latest)](https://travis-ci.com/delucis/bgio-effects)
[![Coverage Status](https://coveralls.io/repos/github/delucis/bgio-effects/badge.svg?branch=latest)](https://coveralls.io/github/delucis/bgio-effects?branch=latest)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/bgio-effects)](https://bundlephobia.com/result?p=bgio-effects)

> 📤 Helpers for managing state effects in [boardgame.io][bgio].

This package provides a structured approach to triggering ephemeral “effects”
in game code that can be consumed from state on the client. It provides a game
plugin and a React board wrapper that emits client-side events for your effects.


## Installation

```sh
npm i bgio-effects
```


## At a glance

Call effects from your moves or other game code:

```js
function move(G, ctx) {
  ctx.effects.explode();
}
```

Listen for effects from your board component:

```js
useEffectListener('explode', () => {
  // render explosion/play sound/etc.
});
```


## Usage

### Plugin

#### Configuration

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
      // (see “Sequencing effects” below).
      duration: 2,
    },
  },
};
```

#### Adding the plugin to your game

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
      G.roll = ctx.random.D6();
      ctx.effects.rollDie(G.roll);
      if (G.roll > 4) ctx.effects.explode();
    },

    end: (G, ctx) => {
      ctx.events.endTurn();
      ctx.effects.endTurn();
    },
  },
};
```

#### Sequencing effects

You can add timing information to your effects to sequence them on the client.
By default, effects have a duration of `0` and are added to the end of the
timeline in the order they are called, which means they will all trigger
together as soon as the game state updates.

You can set an alternative default duration for each effect in its
config object:

```js
{
  effects: {
    longEffect: {
      duration: 5,
    },
  },
}
```

Now an effect called after `longEffect` will be added to the timeline
5 seconds after `longEffect` by default. For example:

```
0  .  .  .  .  5  .  .  .  .  10
↑              ↑
longEffect     nextEffect
```

You can also specify where an effect is placed on the timeline and override its
default duration when calling it, by passing position and duration parameters:

```js
effect(position, duration);
effectWithCreateFn(createArg, position, duration);
```

- ##### `position`

  - **type:** `string` | `number`
  - **default:** `'>'` (end of the timeline)

  Specifies the placement of this effect on the timeline.

  A number places the effect at an absolute time, e.g. `3` would place the
  effect at 3 seconds along the timeline.

  A string is parsed according to a terse syntax for expressing different
  placements along the timeline:

  - `'>'`: Relative to the end of the timeline, for example:

    - `'>+1'`: 1 second after the end of the timeline

    - `'>-1'`: 1 second before the end of the timeline

  - `'<'`: Relative to the start of the last effect on the timeline,
    for example:

    - `'<'`: Aligned with the start of the last effect on the timeline

    - `'<+0.1'`: 0.1 seconds after the start of the last effect on the timeline

  - `'^'`: Insert at an absolute time and shift all subsequent effects in time,
    for example:

    - `'^3'`: Insert at 3 seconds and shift subsequent effects by this effect’s
      duration

    - `'^3->0.5'`: Insert at 3 seconds and shift subsequent effects by
      0.5 seconds

- ##### `duration`

  - **type:** `number`
  - **default:** `0` or `duration` in the effect’s config if set

  A time in seconds to override the effect’s default duration.

##### Example

The following effects create the following timeline.

```js
A(0, 4);    // add A at 0s, with a duration of 4s
B('>-1', 1);// add B 1s before the end of the timeline, i.e. at 3s
C('^2->1'); // add C at 2s, shift later effects by 1s
D('^0', 5); // add D at 0s, shift later effects by its duration (5s)
E('<');     // add E, aligning it with start of last effect
```

```
0  .  .  .  .  5  .  ₇  .  ₉  10
↑              ↑     ↑     ↑
D              A     C    B+E
```

### React

The provided React component wrapper and hooks allow you to consume your effects
as events, emitting them over time if you used the effect sequencing features.

#### `EffectsBoardWrapper`

To include the core effects engine in your app, wrap your board component with
the `EffectsBoardWrapper` before passing it to the boardgame.io client factory:

```js
import { Client } from 'boardgame.io/react';
import { EffectsBoardWrapper } from 'bgio-effects/react';
import { BoardComponent } from './Board';

const board = EffectsBoardWrapper(BoardComponent);
const BGIOClient = Client({ board, /* game, etc. */ });
```

##### Options

In addition to passing `EffectsBoardWrapper` your board component, you can also
pass an options object to configure the effects behaviour.

```js
const board = EffectsBoardWrapper(BoardComponent, {
  // Delay passing the updated boardgame.io state to your board
  // until after the last effect has been triggered.
  // Default: false
  updateStateAfterEffects: true,

  // Global control of the speed of effect playback.
  // Default: 1
  speed: 1,
});
```

#### `useEffectListener`

##### Parameters

1. Effect Type (`string`) — the effect you want to listen for.

2. Callback (`function`) — the function to run when the effect is fired.

3. Dependencies (`array`) — an array of variables your callback depends upon (similar to [React’s `useCallback` hook][useCallback]).

4. _(optional)_ On-End Callback (`function`) — a function to run when the effect
   ends (as defined by the effect’s `duration`).

5. _(optional)_ On-End Dependencies (`array`) — an array of variables your
   on-end callback depends on.

##### Usage

Within your board component or child components, use the `useEffectListener`
hook to listen for effect events:

```js
import { useEffectListener } from 'bgio-effects/react';

function Component() {
  useEffectListener('effectName', (effectPayload) => {}, []);
  return <div/>;
}
```

`effectPayload` will be the data returned by your `create` function or
`undefined` for effects without a `create` function.

Your callback can return a clean-up function, which will be run the next time the effect is fired, if the variables in the dependency array change, or if the component unmounts. This is similar to [cleaning up in React’s `useEffect` hook][cleanup].

##### Special Events

You can listen for _all_ effects using the special `'*'` wildcard. In this case,
your callback receives both the effect name and payload:

```js
useEffectListener('*', (effectName, effectPayload) => {}, []);
```

Two other special events will also always be fired:

- `'effects:start'` will fire before any other effects.

- `'effects:end'` will fire after all the effects in the queue.

##### Example

```js
import React, { useState } from 'react';
import { useEffectListener } from 'bgio-effects/react';

function DiceComponent() {
  const [animate, setAnimate] = useState(false);

  // Subscribe to the “rollDie” effect type:
  useEffectListener(
    // Name of the effect to listen for.
    'rollDie',
    // Function to call when the effect fires.
    () => {
      setAnimate(true);
      const timeout = window.setTimeout(() => setAnimate(false), 1000);
      // Return a clean-up function to cancel the timeout.
      return () => window.clearTimeout(timeout);
    },
    // Dependency array of variables the callback uses.
    [setAnimate]
  );

  return <div className={animate ? 'animated' : 'static'} />;
}
```

#### `useEffectQueue`

##### Usage

The `useEffectQueue` hook lets child components control the effect queue if necessary:

```js
import { useEffectQueue } from 'bgio-effects/react';

function Component() {
  const { clear, flush, size } = useEffectQueue();
  return (
    <div>
      <p>Queue Size: {size}</p>
      <button onClick={clear}>Clear</button>
      <button onClick={flush}>Flush</button>
    </div>
  );
}
```

##### Returns

`useEffectQueue` returns the following methods and properties:

- `clear()`: Cancel any currently queued effects from being fired.
- `flush()`: Immediately trigger any currently queued effects.
- `size`: The number of effects currently queued.

#### Timing precision

This library is not designed with highly precise timing and animation
synchronisation in mind. Effects are emitted from a `requestAnimationFrame`
callback and the general implementation aims to be as performant and simple as
possible. Exact timing will depend on the frame rate of a user’s browser and
the accuracy of `Date.now()` (which may be limited for security reasons).


## Contributing

This is an experimental project and feedback is welcome. Please
[open an issue][bugs] if you run into any problems, have a question, or want
to suggest features/improvements. PRs are welcome too 😊.

Please also note [the code of conduct][COC] and be kind to each other.


## License

The code in this repository is provided under the terms of
[an Anti-Fascist MIT License][license].


[bgio]: https://boardgame.io/
[mitt]: https://github.com/developit/mitt
[useCallback]: https://reactjs.org/docs/hooks-reference.html#usecallback
[cleanup]: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
[bugs]: https://github.com/delucis/bgio-effects/issues/new/choose
[COC]: CODE_OF_CONDUCT.md
[license]: LICENSE
