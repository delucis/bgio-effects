---
title: bgio-effects
description: Documentation for bgio-effects, a boardgame.io plugin to help manage state effects.
layout: layout:MainLayout
setup: |
  import Tabbed from '../components/Tabbed.astro';
  import Demo from './demo';
---

The `bgio-effects` package provides a structured approach to triggering
ephemeral “effects” from [boardgame.io][bgio] game code that can be consumed
from state on the client. It provides a game plugin and a client-side extension
that emits events for your effects.

`bgio-effects` helps manage boardgame.io state in two key ways:

1. It provides an imperative glue between declarative states.

2. It can orchestrate how a state transitions over time.

Check out [the tutorial](tutorial) for more detail about these two concepts
in practice.

## Installation

```bash
npm i bgio-effects
```

## At a glance

Call effects from your moves or other game code:

```js
function move(G, ctx) {
  ctx.effects.explode();
}
```

Listen for effects on the client:

<Tabbed>
<Fragment slot="plain-js">

```js
emitter.on('explode', () => {
  // render explosion/play sound/etc.
});
```

</Fragment>
<Fragment slot="react">

<!-- prettier-ignore-start -->
```js
useEffectListener('explode', () => {
  // render explosion/play sound/etc.
}, []);
```
<!-- prettier-ignore-end -->

</Fragment>
</Tabbed>

## Demo

Here’s a small example demonstrating a sequence of effects triggered by a
single move.

<Demo client:visible />

## Getting started

- [Read the tutorial](tutorial) to see how adding `bgio-effects` to a
  boardgame.io game can solve problems in practice.

- [Read the game plugin docs](plugin/config) for an in-depth guide to
  configuring the `bgio-effects` game plugin.

- Read the [plain JS](client/plain-js) or [React](client/react) client docs to
  see how to setup the client extension.

- Want to try something hands on? Play around with
  [a CodeSandbox of the demo above][demo].

## Contributing

This is an experimental project and feedback is welcome. Please
[open an issue on GitHub][bugs] if you run into any problems, have a question,
or want to suggest features/improvements. PRs are welcome too 😊.

Please also note [the code of conduct][coc] and be kind to each other.

## License

`bgio-effects` is provided under the terms of
[an Anti-Fascist MIT License][license].

[bgio]: https://boardgame.io/
[demo]: https://codesandbox.io/s/bgio-effects-demo-3nzwm
[bugs]: https://github.com/delucis/bgio-effects/issues/new/choose
[coc]: https://github.com/delucis/bgio-effects/blob/latest/CODE_OF_CONDUCT.md
[license]: https://github.com/delucis/bgio-effects/blob/latest/LICENSE
