---
title: Plugin notes
description: General notes about using the bgio-effects plugin.
layout: layout:MainLayout
---

## Passing `G` to effects

boardgame.io [uses Immer internally to help with immutability][imm]. That means
that inside a move or game hook, `G` and its contents are wrapped in a
[`Proxy`][proxy] and we’ll run into issues passing it to an effect. (The only
exception is if we’re passing a property that is a single literal value like a
string, number, or boolean.)

If you want to pass an object or array stored in `G` when calling an effect,
you need to unwrap this proxy to get the plain value. To do this, import and
use [Immer’s `current` helper][current]. This will convert the proxied state to
a plain JavaScript object.

```js
import { current } from 'immer';

// inside a move
const unproxiedValue = current(G.dice);
ctx.effects.roll(unproxiedValue);
```

You can also do this directly inside your effects config, so you don’t need to
remember this every time the effect gets called.

```js
import { current } from 'immer';

export const config = {
  effects: {
    roll: {
      create: (value) => current(value),
    },
  },
};
```

[imm]: https://boardgame.io/documentation/#/immutability
[proxy]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[current]: https://immerjs.github.io/immer/current
