# bgio-effects

[![NPM Version](https://img.shields.io/npm/v/bgio-effects)](https://www.npmjs.com/package/bgio-effects)
[![Build Status](https://github.com/delucis/bgio-effects/workflows/CI/badge.svg)](https://github.com/delucis/bgio-effects/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/delucis/bgio-effects/badge.svg?branch=latest)](https://coveralls.io/github/delucis/bgio-effects?branch=latest)

> 📤 Helpers for managing state effects in [boardgame.io][bgio].

This package provides a structured approach to triggering ephemeral “effects”
in game code that can be consumed from state on the client. It provides a game
plugin and a client-side extension that emits events for your effects.

## 💾 Installation

```sh
npm i bgio-effects
```

## 👀 At a glance

Call effects from your moves or other game code:

```js
function move(G, ctx) {
  ctx.effects.explode();
}
```

Listen for effects on the client:

```js
const onExplode = () => {
  // render explosion/play sound/etc.
};

// With the plain JS emitter
emitter.on('explode', onExplode);

// With the React hook
useEffectListener('explode', onExplode, []);
```

## 📚 Documentation

**[See the full documentation website →][docs]**

## 🙌 Contributing

This is an experimental project and feedback is welcome. Please
[open an issue][bugs] if you run into any problems, have a question, or want
to suggest features/improvements. PRs are welcome too 😊.

Please also note [the code of conduct][coc] and be kind to each other.

## 📄 License

The code in this repository is provided under the terms of
[an Anti-Fascist MIT License][license].

[bgio]: https://boardgame.io/
[docs]: https://delucis.github.io/bgio-effects/
[bugs]: https://github.com/delucis/bgio-effects/issues/new/choose
[coc]: CODE_OF_CONDUCT.md
[license]: LICENSE
