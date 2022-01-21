---
title: Tutorial
description: A guide to using bgio-effects with boardgame.io.
layout: layout:MainLayout
setup: |
  import Aside from '../../components/Aside.astro';
  import Tabbed from '../../components/Tabbed.astro';
  import Game1 from './snippet-1.tsx';
  import Game2 from './snippet-2.tsx';
  import Game3 from './snippet-3.tsx';
---

This guide shows how adding `bgio-effects` to an example boardgame.io game
can help solve subtle issues that may occur when rendering your game state
on the client. It assumes a basic understanding of the [boardgame.io][bgio]
framework. Check out [the tutorial in their docs][bgio-tut] to learn more.

## Installation

To start using `bgio-effects`, we first have to add the NPM package to our
project:

```bash
npm i bgio-effects

# or yarn add bgio-effects
```

## Our starting point

We will start with a single-player game. Each turn, the player rolls a die.
If they roll a 6, they get a point. Once they’ve scored 5 points, they win!

```js
const game = {
  // Game state includes the current die value & the current score.
  setup: () => ({ roll: 1, score: 0 }),

  moves: {
    roll: (G, ctx) => {
      G.roll = ctx.random.D6();
      if (G.roll === 6) G.score++;
    },
  },

  // End the game when the player has scored 5 points.
  endIf: (G) => G.score >= 5,
};
```

A UI for playing this thrilling game of skill could look something like this.

<Game1 client:visible />

Here’s an example of how we might update the die each time we receive a state
update from boardgame.io. This code is buggy. We’ll see why in the next
section.

<Tabbed>
<Fragment slot="plain-js">

```js
let previousRoll;

client.subscribe(({ G }) => {
  // If G.roll has changed, trigger the die’s roll animation.
  if (G.roll !== previousRoll) animateDie(G.roll);
  previousRoll = G.roll;

  // more logic to render score, etc.
});
```

(The `client` variable in this example is a plain JS boardgame.io client.)

</Fragment>
<Fragment slot="react">

```jsx
const Board = ({ G }) => {
  // Each time G.roll changes, trigger the die’s roll animation.
  useEffect(() => {
    animateDie(G.roll);
  }, [G.roll]);

  return <div>{/* render die, score etc. */}</div>;
};
```

</Fragment>
</Tabbed>

## Spot the difference

boardgame.io tells us the current state of the game each time it changes.
But it doesn’t tell us _what_ changed. A lot of the time, that’s OK. For
example, the score in our UI increments each time a 6 is rolled. It doesn’t
matter what the previous score was, we just need to display the current one.

However, if you’ve tried rolling the die in our example above, you may have
noticed a problem. Sometimes the roll animation isn’t triggered! That’s
because we’re only animating the die when `G.roll` changes. What happens if
we roll the same value twice in a row? Nothing. The value of `G.roll` hasn’t
changed, so the animation wasn’t triggered.

So now comes the problem: how do we tell if a `1` followed by a `1` means that
the die wasn’t rolled or if it means that we rolled a `1` twice in a row?

`bgio-effects` is one answer to that question. It allows the game code to
say explicitly, “The die was rolled,” so that the client doesn’t have to guess
by trying to spot the difference between two states.

<Aside type="note">

You might be thinking, “Can’t we just animate the die every move? Why
only when `G.roll` changes?” In this minimal example, maybe we could. But
imagine we had two moves in our game and only one of them rolled the die.
Then animating the die every move wouldn’t work either.

</Aside>

## Adding effects to the game

`bgio-effects` provides a plugin for boardgame.io that adds new functionality
for use in your game code. We import the plugin like this:

```js
import { EffectsPlugin } from 'bgio-effects/plugin';
```

We now need to configure the plugin so it knows about the kinds of effects that
exist in our game. Let’s configure a single `roll` effect that will take the
new value of the rolled die. (See [the configuration docs][config-docs]
for more details.)

```js
const configuredEffectsPlugin = EffectsPlugin({
  effects: {
    roll: {
      create: (value) => value,
    },
  },
});
```

Now we add our `configuredEffectsPlugin` to our game’s `plugins` and update our
`roll` move to use the effects API we’ve just added.

```js
const game = {
  // Add the plugin to the game.
  plugins: [configuredEffectsPlugin],

  setup: () => ({ roll: 1, score: 0 }),

  moves: {
    roll: (G, ctx) => {
      G.roll = ctx.random.D6();
      // Call the newly added roll effect.
      ctx.effects.roll(G.roll);
      if (G.roll === 6) G.score++;
    },
  },

  endIf: (G) => G.score >= 5,
};
```

This won’t appear to have much effect yet. `G` still looks and behaves the
same, but behind the scenes, the plugin is storing data that will let us
receive effects on the client.

## Listening for effects

We can update how our client code triggers the die animation. Instead of
animating each time `G.roll` changes, we can animate each time our new
`roll` effect is emitted.

<Tabbed>
<Fragment slot="plain-js">

```js
import { EffectsEmitter } from 'bgio-effects/client';

const emitter = EffectsEmitter(client);

emitter.on('roll', (newValue) => {
  animateDie(newValue);
});

emitter.state.subscribe((state) => {
  // more logic to render score, etc.
});
```

<Aside type="info">

Note that we are no longer calling `client.subscribe` to get the main state
update. Instead, we call `emitter.state.subscribe`. For now these are
equivalent, but as we shall see later, subscribing via the emitter will have
some advantages.

</Aside>

See [the plain JS client docs][plainjs-docs] for more details about
`EffectsEmitter`.

</Fragment>
<Fragment slot="react">

<!-- prettier-ignore-start -->
```jsx
import { EffectsBoardWrapper, useEffectListener } from 'bgio-effects/react';

const Board = ({ G }) => {
  // Each time the roll effect fires, trigger the die’s roll animation.
  useEffectListener('roll', (newValue) => {
    animateDie(newValue)
  }, []);

  return <div>{/* render die, score etc. */}</div>;
};

// Wrap the board component to add the effects emitter.
// Pass this wrapped component to boardgame.io’s React client.
const BoardWithEffects = EffectsBoardWrapper(Board);
```
<!-- prettier-ignore-end -->

See [the React client docs][react-docs] for more details about the
`EffectsBoardWrapper` and the `useEffectListener` hook.

</Fragment>
</Tabbed>

With these changes implemented, our die rolls every time it should! Even if
we roll the same value twice in a row.

<Game2 client:visible />

<Aside>

You may notice that this fixed another subtle bug. The last implementation
played the die animation when the component first mounted. Because
[`bgio-effects` doesn’t emit effects on initial render][initial-render],
that problem has also been fixed.

</Aside>

## Wait a second…

History hangs in the balance. Will you roll a six and move one point closer to
a hard-won victory? The die spins, starting to settle. You’re in suspense, on
tenterhooks, waiting with baited breath… Or rather, you would be, but our UI
ruins the tension. While the die spins, the score updates immediately and gives
away what the result will be.

Timing is the second area where `bgio-effects` can help us out.

When configuring the effects plugin, we can set a default duration for each
effect. The die animation takes 1 second, so we set the `roll` effect to have a
duration of `1`.

```js
const configuredEffectsPlugin = EffectsPlugin({
  effects: {
    roll: {
      create: (value) => value,
      // Give our effect a default duration of 1 second.
      duration: 1,
    },
  },
});
```

On its own this change won’t do anything yet. We want to delay showing the new
score until the effect has finished. To do that we need to make a change to our
client.

<Tabbed>
<Fragment slot="plain-js">

We can opt into this behaviour when setting up our `EffectsEmitter`:

```js
const emitter = EffectsEmitter(client, {
  // Wait until all effects have finished before updating state.
  updateStateAfterEffects: true,
});
```

</Fragment>
<Fragment slot="react">

We can opt into this behaviour when wrapping our board component:

```js
const BoardWithEffects = EffectsBoardWrapper(Board, {
  // Wait until all effects have finished before updating state.
  updateStateAfterEffects: true,
});
```

</Fragment>
</Tabbed>

By enabling the `updateStateAfterEffects` option, we can continue to use the
declarative state provided by boardgame.io wherever it makes sense to, but
only show it once we’ve finished rendering effects.

After adding these two changes to our example UI, you can see that the score
only updates once the die stops rolling.

<Game3 client:visible />

## Wrapping up

We’ve successfully used `bgio-effects` to solve a couple of problems that would
have been tricky to fix using boardgame.io on its own. Using a roll effect
gave us an imperative hook to trigger animations with instead of trying to
compare state updates on the client. Adding an effect duration and turning on
`updateStateAfterEffects` allowed us to delay state updates until our `roll`
effect had completed.

Next, you may want to read about how to
[sequence multiple effects][sequencing] or look at the in-depth client
documentation for [plain JS][plainjs-docs] and [React][react-docs]
clients.

[bgio]: https://boardgame.io/
[bgio-tut]: https://boardgame.io/documentation/#/tutorial
[config-docs]: ../plugin/config
[plainjs-docs]: ../client/plain-js
[initial-render]: ../client/notes#initial-render
[react-docs]: ../client/react
[sequencing]: ../plugin/sequencing
