---
title: With a plain JS client
description: How to use bgio-effects with boardgame.io’s plain JavaScript client.
layout: layout:MainLayout
---

The provided `EffectsEmitter` function allows you to consume your effects as
events, emitting them over time if you used the effect sequencing features.

## `EffectsEmitter`

`EffectsEmitter` wraps a boardgame.io client, returning an API that allows you
to subscribe to specific effects as well as the latest boardgame.io state.

To create an emitter instance, pass your boardgame.io client to
`EffectsEmitter`:

```js
import { Client } from 'boardgame.io/client';
import { EffectsEmitter } from 'bgio-effects/client';

const client = Client({
  /* game, etc. */
});
const emitter = EffectsEmitter(client);
client.start();
```

### Options

In addition to passing `EffectsEmitter` the boardgame.io client, you can pass
an options object to configure the effects behaviour.

```js
const emitter = EffectsEmitter(client, {
  // Delay updating emitter.state until after the
  // last effect has been triggered.
  // Default: false
  updateStateAfterEffects: true,

  // Global control of the speed of effect playback.
  // Default: 1
  speed: 1,
});
```

## `EffectsEmitter#on()`

### Parameters

1. Effect Type (`string`) — the effect you want to listen for.

2. Callback (`function`) — the function to run when the effect is fired.

3. _(optional)_ On-End Callback (`function`) — a function to run when the effect
   ends (as defined by the effect’s `duration`).

### Returns

An unsubscribe callback.

### Usage

Call your emitter instance’s `on` method to listen for effect events.

```js
// Subscribe to the “effectName” effect.
const unsubscribe = emitter.on('effectName', (effectPayload, bgioState) => {});

// When you want to stop listening for this effect,
// call the returned unsubscribe callback.
unsubscribe();
```

`effectPayload` will be the data returned by your `create` function or
`undefined` for effects without a `create` function.

`bgioState` will be the latest state passed by boardgame.io. This is particularly useful when using the `updateStateAfterEffects` option to get early access to the new global state.

### Special Events

You can listen for _all_ effects using the special `'*'` wildcard. In this case,
your callback receives both the effect name and payload:

```js
emitter.on('*', (effectName, effectPayload, boardProps) => {});
```

Two other special events will also always be fired:

- `'effects:start'` will fire before any other effects.

- `'effects:end'` will fire after all the effects in the queue have completed.

### Example

```js
const dice = document.querySelector('#dice');

const onRollStart = () => dice.classList.add('animated');
const onRollEnd = () => dice.classList.remove('animated');

emitter.on('rollDie', onRollStart, onRollEnd);
```

## `EffectsEmitter#state`

An emitter instance has a `state` property which is a store you can subscribe
to that mirrors boardgame.io’s state. The only difference between subscribing
to `EffectsEmitter#state` and subscribing directly to the boardgame.io client
is that `EffectsEmitter#state` delays updating if you set the
`updateStateAfterEffects` option to `true` when creating the emitter.

### Usage

Subscribe to state updates:

```js
// Instead of client.subscribe((state) => {}), use this:
const unsubscribe = emitter.state.subscribe((state) => {});
```

Or get the current state:

```js
// Instead of client.getState(), use this:
const state = emitter.state.get();
```

## Queue API

`EffectsEmitter` instances also expose an API to allow direct control of the
effect queue if necessary.

- `EffectsEmitter#clear()`: Cancel any currently queued effects from being fired.
- `EffectsEmitter#flush()`: Immediately trigger any currently queued effects.
- `EffectsEmitter#size`: A subscribable store containing the number of effects
  currently queued.

### Usage

```js
const clearButton = document.querySelector('button#clear');
clearButton.addEventListener('click', () => {
  emitter.clear();
});

const flushButton = document.querySelector('button#flush');
flushButton.addEventListener('click', () => {
  emitter.flush();
});

const queueSizeEl = document.querySelector('#queue-size');
emitter.size.subscribe((size) => {
  queueSizeEl.textContent = 'Queue size: ' + size;
});
```
