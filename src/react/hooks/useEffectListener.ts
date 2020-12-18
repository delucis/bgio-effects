import { useCallback, useContext, useEffect } from 'react';
import { EffectsContext } from '../contexts';
import type { EffectsPluginConfig, ListenerArgs } from '../../types';
import { hookErrorMessage } from './utils';

/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 * @param dependencyArray - Array of variables the callback function depends on.
 */
export function useEffectListener<C extends EffectsPluginConfig>(
  ...args: ListenerArgs<C['effects']>
) {
  const emitter = useContext(EffectsContext);
  if (!emitter) throw new Error(hookErrorMessage('useEffectListener'));
  const [effectType, cb, deps] = args;
  const callback = useCallback(cb, deps);

  useEffect(() => {
    let cleanup: void | (() => void);

    emitter.on(effectType as string, (...args) => {
      if (typeof cleanup === 'function') cleanup();
      cleanup = callback(...args);
    });

    return () => {
      emitter.off(effectType as string, callback as (...args: any) => any);
      if (typeof cleanup === 'function') cleanup();
    };
  }, [emitter, effectType, callback]);
}
