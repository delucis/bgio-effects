---
title: With a React client
description: How to use bgio-effects with boardgame.io’s React client.
layout: layout:MainLayout
setup: |
  import Aside from '../../components/Aside.astro';
---

The provided React component wrapper and hooks allow you to consume your effects
as events, emitting them over time if you used the effect sequencing features.

## Higher-order components

### `EffectsBoardWrapper`

To include the core effects engine in your app, wrap your board component with
the `EffectsBoardWrapper` before passing it to the boardgame.io client factory:

```js
import { Client } from 'boardgame.io/react';
import { EffectsBoardWrapper } from 'bgio-effects/react';
import { BoardComponent } from './Board';

const board = EffectsBoardWrapper(BoardComponent);
const BGIOClient = Client({ board /* game, etc. */ });
```

#### Options

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

<Aside title="Higher-order what?!">

You can read [a whole page about higher-order components][hoc] in the React
docs.

</Aside>

## Hooks

### `useEffectListener`

#### Parameters

1. Effect Type (`string`) — the effect you want to listen for.

2. Callback (`function`) — the function to run when the effect is fired.

3. Dependencies (`array`) — an array of variables your callback depends upon (similar to [React’s `useCallback` hook][usecallback]).

4. _(optional)_ On-End Callback (`function`) — a function to run when the effect
   ends (as defined by the effect’s `duration`).

5. _(optional)_ On-End Dependencies (`array`) — an array of variables your
   on-end callback depends on.

#### Usage

Within your board component or child components, use the `useEffectListener`
hook to listen for effect events:

<!-- prettier-ignore-start -->
```js
import { useEffectListener } from 'bgio-effects/react';

function Component() {
  useEffectListener('effectName', (effectPayload, boardProps) => {
    // run side-effect code
  }, []);
  return <div />;
}
```
<!-- prettier-ignore-end -->

- **`effectPayload`** will be the data returned by your `create` function or
  `undefined` for effects without a `create` function.

- **`boardProps`** will be the latest props passed by boardgame.io. This is
  particularly useful when using the `updateStateAfterEffects` option to get
  early access to the new global state.

Your callback can return a clean-up function, which will be run the next time
the effect is fired, if the variables in the dependency array change, or if the
component unmounts. This is similar to
[cleaning up in React’s `useEffect` hook][cleanup].

<Aside type="tip">

The `useEffectListener` hook is the most low-level way to subscribe to effects
and execute code when they fire. Make sure you also read about
[the `useEffectState` hook](#useeffectstate), which can be simpler to use and
is often sufficient.

</Aside>

#### Special Events

You can listen for _all_ effects using the special `'*'` wildcard. In this case,
your callback receives both the effect name and payload:

```js
useEffectListener('*', (effectName, effectPayload, boardProps) => {}, []);
```

Two other special events will also always be fired:

- `'effects:start'` will fire before any other effects.

- `'effects:end'` will fire after all the effects in the queue have completed.

#### Example

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

### `useEffectState`

The `useEffectState` hook provides an abstraction around `useEffectListener`
for cases where you don’t need to call other imperative code
when an effect fires.

#### Parameters

1. Effect Type (`string`) — the effect you want to observe state for.

2. _(optional)_ Initial State (`any`) — a value to use for `state` before
   an effect is received.

#### Returns

A `[state, isActive]` tuple.

- `state`: The latest value for this effect type.
  This will be `undefined` until the effect fires.
- `isActive`: A boolean indicating whether the effect is currently active.

#### Usage

```js
import { useEffectState } from 'bgio-effects/react';

function Component() {
  const [roll, isRolling] = useEffectState('rollDie', 1);
  const className = isRolling ? 'animated' : 'static';
  return <div className={className}>{roll}</div>;
}
```

### `useLatestPropsOnEffect`

When using the `updateStateAfterEffects` option, you may run into situations
where you have components that need the latest boardgame.io props _before_ the
global props get updated. This hook allows you to get the latest props early
when the specified effects fire.

#### Parameters

One or more effect types that should cause the props to update.

#### Returns

The [boardgame.io board props][bgio-props].

#### Usage

```js
import { useLatestPropsOnEffect } from 'bgio-effects/react';

function Component() {
  const { G, ctx } = useLatestPropsOnEffect('rollDie', 'endTurn');
  return <div>{G.roll}</div>;
}
```

This also works with [the special events](#special-events). For example,
in a component that needs the latest props as soon as they are available:

```js
const { G, ctx } = useLatestPropsOnEffect('effects:start');
```

<Aside type="tip">

If you want to make sure your component updates even if none of the specified
effects fire, include `'effects:end'` in the list of effects. That way your
component will update once all effects have fired at the latest.

```js
const { G, ctx } = useLatestPropsOnEffect('rollDie', 'effects:end');
```

</Aside>

### `useEffectQueue`

#### Usage

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

#### Returns

`useEffectQueue` returns the following methods and properties:

- `clear()`: Cancel any currently queued effects from being fired.
- `flush()`: Immediately trigger any currently queued effects.
- `size`: The number of effects currently queued.

[hoc]: https://reactjs.org/docs/higher-order-components.html
[usecallback]: https://reactjs.org/docs/hooks-reference.html#usecallback
[cleanup]: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
[bgio-props]: https://boardgame.io/documentation/#/api/Client?id=board-props
