import type { Emitter, Handler, WildcardHandler } from 'mitt';
import { useCallback, useContext, useEffect } from 'react';
import { EffectsContext } from '../contexts';
import type { EffectsPluginConfig, ListenerArgs } from '../../types';
import { hookErrorMessage } from './utils';

type AnyHandler = Handler | WildcardHandler;
type NaiveArgs = [
  string,
  AnyHandler,
  React.DependencyList,
  AnyHandler?,
  React.DependencyList?
];

/**
 * No-op fallback for `useCallback` that is never actually called.
 */
// istanbul ignore next
function noop() {}

/**
 * Subscribe to a Mitt instance with automatic callback memoization & clean-up.
 * @param  emitter - The Mitt instance to subscribe to.
 * @param  effectType - Name of the effect to listen for. '*' listens to any.
 * @param  handler - Function to call when the event is emitted.
 * @param  dependencies - Array of variables the handler depends on.
 */
function useMittSubscription(
  emitter: Emitter,
  effectType: string,
  handler: AnyHandler | undefined,
  dependencies: React.DependencyList | undefined = []
) {
  const hasHandler = !!handler;
  const memoizedHandler = useCallback(handler || noop, dependencies);

  useEffect(() => {
    if (!hasHandler) return;

    let cleanup: void | (() => void);

    const cb = (...args: any[]) => {
      if (typeof cleanup === 'function') cleanup();
      cleanup = (memoizedHandler as any)(...args);
    };

    emitter.on(effectType, cb);

    return () => {
      emitter.off(effectType, cb);
      if (typeof cleanup === 'function') cleanup();
    };
  }, [effectType, emitter, memoizedHandler, hasHandler]);
}

/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 * @param dependencyArray - Array of variables the callback function depends on.
 * @param onEndCallback - Function to call when the effect ends.
 * @param onEndDependencyArray - Array of variables onEndCallback depends on.
 */
export function useEffectListener<C extends EffectsPluginConfig>(
  ...args: ListenerArgs<C['effects']>
) {
  const { emitter, endEmitter } = useContext(EffectsContext);
  const [effectType, cb, deps, onEndCb, onEndDeps] = args as NaiveArgs;

  if (!emitter || !endEmitter)
    throw new Error(hookErrorMessage('useEffectListener'));
  if (!deps)
    throw new TypeError(
      'useEffectListener must receive a dependency list as its third argument.'
    );
  if (onEndCb && !onEndDeps)
    throw new TypeError(
      'useEffectListener must receive a dependency list as its fifth argument when using an onEffectEnd callback.'
    );

  useMittSubscription(emitter, effectType, cb, deps);
  useMittSubscription(endEmitter, effectType, onEndCb, onEndDeps);
}
