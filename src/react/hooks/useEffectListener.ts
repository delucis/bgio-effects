import type { BoardProps } from 'boardgame.io/react';
import { useCallback, useContext, useEffect } from 'react';
import { EffectsContext } from '../contexts';
import type { EffectsPluginConfig } from '../../types';
import type { ListenerArgs } from '../types';
import { hookErrorMessage } from './utils';
import { EffectsEmitter } from '../../emitter/emitter';

type NaiveEffectListener = (payload: any, boardProps: BoardProps) => void;
type NaiveWildcardListener = (
  effectName: string | symbol | number,
  payload: any,
  boardProps: BoardProps
) => void;
type NaiveListener = NaiveWildcardListener | NaiveEffectListener;
type NaiveArgs = [
  string,
  NaiveListener,
  React.DependencyList,
  NaiveListener?,
  React.DependencyList?
];

/**
 * No-op fallback for `useCallback` that is never actually called.
 */
// istanbul ignore next
function noop() {}

/**
 * Subscribe to a Mitt instance with automatic callback memoization & clean-up.
 * @param  emitter - The `EffectsEmitter` instance to subscribe to.
 * @param  effectType - Name of the effect to listen for. '*' listens to any.
 * @param  startHandler - Function to call when the event is emitted.
 * @param  startDeps - Array of variables the handler depends on.
 */
function useEmitterSubscription(
  emitter: EffectsEmitter<BoardProps>,
  effectType: string,
  startHandler: NaiveListener,
  startDeps: React.DependencyList,
  endHandler?: NaiveListener,
  endDeps: React.DependencyList = []
) {
  endHandler = endHandler || noop;
  /**
   * This is not strictly speaking a safe use of `useCallback.`
   * Code like `useEffectListener('x', flag ? () => {} : () => {}, [])`
   * will be buggy. The initially passed function will never be updated because
   * the functions themselves aren’t included as dependencies (to avoid
   * infinite loops). It seems there is no technically correct way to
   * wrap `useCallback` in a custom hook if the function comes from outside
   * the hook. The only 100% correct solution here would be to require users
   * to pass a stable function they got from `useCallback` themselves,
   * which for now we’ve avoided in order to simplify the API.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onStartMemo = useCallback(startHandler, [...startDeps, effectType]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onEndMemo = useCallback(endHandler, [...endDeps, effectType]);

  useEffect(() => {
    let cleanup: void | (() => void);
    const onStart: NaiveEffectListener = (...args) => {
      if (typeof cleanup === 'function') cleanup();
      cleanup = (onStartMemo as NaiveEffectListener)(...args);
    };

    let onEndCleanup: void | (() => void);
    const onEnd: NaiveEffectListener = (...args) => {
      if (typeof onEndCleanup === 'function') onEndCleanup();
      onEndCleanup = (onEndMemo as NaiveEffectListener)(...args);
    };

    const unsubscribe = emitter.on(effectType, onStart, onEnd);

    return () => {
      unsubscribe();
      if (typeof cleanup === 'function') cleanup();
      if (typeof onEndCleanup === 'function') onEndCleanup();
    };
  }, [effectType, emitter, onStartMemo, onEndMemo]);
}

/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 * @param dependencyArray - Array of variables the callback function depends on.
 * @param onEndCallback - Function to call when the effect ends.
 * @param onEndDependencyArray - Array of variables onEndCallback depends on.
 */
export function useEffectListener<C extends EffectsPluginConfig, G = any>(
  ...args: ListenerArgs<C['effects'], G>
): void {
  const emitter = useContext(EffectsContext);
  const [effectType, cb, deps, onEndCb, onEndDeps] = args as NaiveArgs;

  if (!emitter) throw new Error(hookErrorMessage('useEffectListener'));
  if (!deps)
    throw new TypeError(
      'useEffectListener must receive a dependency list as its third argument.'
    );
  if (onEndCb && !onEndDeps)
    throw new TypeError(
      'useEffectListener must receive a dependency list as its fifth argument when using an onEffectEnd callback.'
    );

  useEmitterSubscription(emitter, effectType, cb, deps, onEndCb, onEndDeps);
}
