# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.1](https://github.com/delucis/bgio-effects/compare/v0.7.0...v0.7.1) (2022-01-22)


### Bug Fixes

* **emitter:** call onEnd callbacks when flushing ([aff8ddb](https://github.com/delucis/bgio-effects/commit/aff8ddb20bc3ef27860c0ded850c528c3122f8de))

## [0.7.0](https://github.com/delucis/bgio-effects/compare/v0.6.1...v0.7.0) (2022-01-22)


### ⚠ BREAKING CHANGES

* **emitter:** This may be a breaking change if you were relying on the previous queue being
discarded. Given that would be highly timing dependent between when moves where executed, that seems
unlikely to be the case, but flagging this as potentially breaking nonetheless.

### Features

* **emitter:** flush remaining effects queue on state update ([f4076aa](https://github.com/delucis/bgio-effects/commit/f4076aa0db33472522c9ec54c60812c779a89724)), closes [#57](https://github.com/delucis/bgio-effects/issues/57)

### [0.6.1](https://github.com/delucis/bgio-effects/compare/v0.6.0...v0.6.1) (2022-01-22)


### Features

* **emitter:** Use `setTimeout` if `requestAnimationFrame` doesn’t run ([1ee064f](https://github.com/delucis/bgio-effects/commit/1ee064fd1ba9e02ad440b9b858a821dd87c9a4af)), issue [#57](https://github.com/delucis/bgio-effects/issues/57)

## [0.6.0](https://github.com/delucis/bgio-effects/compare/v0.5.1...v0.6.0) (2022-01-14)


### ⚠ BREAKING CHANGES

* The public API for the existing packages has not changed and should continue to work as previously. The React unit tests remain unchanged. However, because this is such a thorough rewrite, there may be small differences that turn out to be breaking in subtle edge cases.

We are also now using an internal type that was added in boardgame.io@0.42.0, so no longer support 0.39.16, ^0.40 and ^0.41.

### Features

* Rewrite client-side effects emitter & add plain JS support ([#367](https://github.com/delucis/bgio-effects/issues/367)) ([39812a8](https://github.com/delucis/bgio-effects/commit/39812a8deff92574236bbb4a887a1be4eff10e83)), closes [#148](https://github.com/delucis/bgio-effects/issues/148)

### [0.5.1](https://github.com/delucis/bgio-effects/compare/v0.5.0...v0.5.1) (2022-01-11)


### Bug Fixes

* inline UUID generator ([9bf6470](https://github.com/delucis/bgio-effects/commit/9bf64707df68916d16af5c2216dd63d45ff5168d)), closes [#362](https://github.com/delucis/bgio-effects/issues/362)

## [0.5.0](https://github.com/delucis/bgio-effects/compare/v0.4.8...v0.5.0) (2021-12-12)


### ⚠ BREAKING CHANGES

* Node 10 is no longer officially supported. The package itself has not changed, so should continue to work in Node 10, but we aren’t testing against 10 anymore, so that may break at any time from now on without notice.

### ci

* drop Node 10 & 15, add Node 16 ([b9b6dd9](https://github.com/delucis/bgio-effects/commit/b9b6dd93d90a00fee44e7c5990e617c73fd7fee2))

### [0.4.8](https://github.com/delucis/bgio-effects/compare/v0.4.7...v0.4.8) (2021-09-15)

### [0.4.7](https://github.com/delucis/bgio-effects/compare/v0.4.6...v0.4.7) (2021-05-11)

### [0.4.6](https://github.com/delucis/bgio-effects/compare/v0.4.5...v0.4.6) (2021-04-28)

### [0.4.5](https://github.com/delucis/bgio-effects/compare/v0.4.4...v0.4.5) (2021-02-04)

### [0.4.4](https://github.com/delucis/bgio-effects/compare/v0.4.3...v0.4.4) (2021-02-01)


### Features

* Add useLatestPropsOnEffect hook ([#112](https://github.com/delucis/bgio-effects/issues/112)) ([6befcca](https://github.com/delucis/bgio-effects/commit/6befcca891a4a659c05b49197ce11aae1c5c1f8a))

### [0.4.3](https://github.com/delucis/bgio-effects/compare/v0.4.2...v0.4.3) (2021-01-29)


### Features

* Add update callback to release state early ([#110](https://github.com/delucis/bgio-effects/issues/110)) ([e724a0c](https://github.com/delucis/bgio-effects/commit/e724a0c99df33a75c2062bda4f10c2a06c7ddffe))

### [0.4.2](https://github.com/delucis/bgio-effects/compare/v0.4.1...v0.4.2) (2021-01-27)


### Features

* **react:** Pass board props to effect listeners ([60ab10f](https://github.com/delucis/bgio-effects/commit/60ab10fb0734332f5058c23e6ccdd484ccb2ebea))

### [0.4.1](https://github.com/delucis/bgio-effects/compare/v0.4.0...v0.4.1) (2021-01-04)


### Features

* **react:** Support setting initial value in `useEffectState` ([4d2918a](https://github.com/delucis/bgio-effects/commit/4d2918acf42e6a64bb2b46229871cf04a1cf0fd8))

## [0.4.0](https://github.com/delucis/bgio-effects/compare/v0.3.2...v0.4.0) (2021-01-04)


### ⚠ BREAKING CHANGES

* **hooks:** If previously `useEffectListener` was used without 
passing a dependency list (which may have worked in some edge cases), 
this will now cause `useEffectListener` to throw an error.

### Features

* **hooks:** error if `useEffectListener` isn’t passed a dependency list ([3218bd7](https://github.com/delucis/bgio-effects/commit/3218bd79bc59c3e1bcff990ff93c92ebe5b3278c))
* Add “onEnd” callbacks to `useEffectListener` ([#99](https://github.com/delucis/bgio-effects/issues/99)) ([e084226](https://github.com/delucis/bgio-effects/commit/e0842264b680fdf69f239286b3c4b1743899f7de))
* **react:** Add `useEffectState` utility hook ([#100](https://github.com/delucis/bgio-effects/issues/100)) ([e91e19b](https://github.com/delucis/bgio-effects/commit/e91e19b89536d06b125ad4e91d144ae18059481c))

### [0.3.2](https://github.com/delucis/bgio-effects/compare/v0.3.1...v0.3.2) (2020-08-16)


### Bug Fixes

* Include alias package.json files in npm bundle ([ff12d4b](https://github.com/delucis/bgio-effects/commit/ff12d4bb2187e1a22e5ca31c78588ff5e60c34aa))

### [0.3.1](https://github.com/delucis/bgio-effects/compare/v0.3.0...v0.3.1) (2020-08-16)


### Bug Fixes

* Actually add aliases for the react & plugin import paths ([ac91fb9](https://github.com/delucis/bgio-effects/commit/ac91fb9fdce3cef8f18b2b132e66712293d35ab0))

## [0.3.0](https://github.com/delucis/bgio-effects/compare/v0.2.0...v0.3.0) (2020-08-16)


### ⚠ BREAKING CHANGES

* Import paths have changed. You must now import from 
'bgio-effects/react' or 'bgio-effects/plugin' rather than from the 
top-level package. Types are still available via the top-level.

### Features

* restructure package to split react & plugin into different entrypoints ([137bfc3](https://github.com/delucis/bgio-effects/commit/137bfc31b5e8fbf30ad85bef86054800b3962fd3))

## [0.2.0](https://github.com/delucis/bgio-effects/compare/v0.1.9...v0.2.0) (2020-08-07)


### Features

* **timeline:** Add builtin `effects:start` and `effects:end` events ([9011cc7](https://github.com/delucis/bgio-effects/commit/9011cc771c36aa84f83f359b93843beb9a850ed6))

### [0.1.9](https://github.com/delucis/bgio-effects/compare/v0.1.8...v0.1.9) (2020-07-27)

### [0.1.8](https://github.com/delucis/bgio-effects/compare/v0.1.7...v0.1.8) (2020-07-27)

### [0.1.7](https://github.com/delucis/bgio-effects/compare/v0.1.6...v0.1.7) (2020-07-26)


### Bug Fixes

* **react:** Cleanup effect listener before calling next callback ([e6dc3a1](https://github.com/delucis/bgio-effects/commit/e6dc3a189ac6808e4dd80509a0f0228370653172))
* **react:** Remove check ensuring `useEffectListener` callback exists ([9b9170e](https://github.com/delucis/bgio-effects/commit/9b9170ec0f9487701ffd40076cf5ab47839f6e82))

### [0.1.6](https://github.com/delucis/bgio-effects/compare/v0.1.5...v0.1.6) (2020-07-25)


### Bug Fixes

* **react:** Don’t rerender from RAF if queue didn’t change ([ff28d73](https://github.com/delucis/bgio-effects/commit/ff28d7300478b1882426f93bbdc452b343444098))

### [0.1.5](https://github.com/delucis/bgio-effects/compare/v0.1.4...v0.1.5) (2020-07-25)


### Bug Fixes

* **react:** Don’t prematurely update boardgame.io props ([964acb5](https://github.com/delucis/bgio-effects/commit/964acb5e2c4ab8330a0a7c938ceea5ee30a810ee))

### [0.1.4](https://github.com/delucis/bgio-effects/compare/v0.1.3...v0.1.4) (2020-07-24)


### Bug Fixes

* **react:** Correctly handle boardgame.io prop updates ([5f15b9a](https://github.com/delucis/bgio-effects/commit/5f15b9ac46a08e8e51d51abf01f9b06b8aa6323a))

### [0.1.3](https://github.com/delucis/bgio-effects/compare/v0.1.2...v0.1.3) (2020-07-24)


### Bug Fixes

* **react:** Remove stray debugging element from React context provider ([95f4464](https://github.com/delucis/bgio-effects/commit/95f446469b3eb4fddb8c3bb62ba2e163690c1c99))

### [0.1.2](https://github.com/delucis/bgio-effects/compare/v0.1.1...v0.1.2) (2020-07-24)


### Bug Fixes

* **react:** Fix updates for the main boardgame.io state ([a7a6dee](https://github.com/delucis/bgio-effects/commit/a7a6deea1cc725440b3ea741150fb9bc4b3804ed))

### [0.1.1](https://github.com/delucis/bgio-effects/compare/v0.1.0...v0.1.1) (2020-07-24)

## 0.1.0 (2020-07-24)


### Features

* Add timeline & playback, upgrade deps, add tests, improve types ([5b30ef2](https://github.com/delucis/bgio-effects/commit/5b30ef2acbc743487d1bb3012f860d92d0ab2c43))
