import React, { useContext, useEffect, useState } from 'react';
import mitt from 'mitt';
import type { EffectsPluginConfig, Data } from './types';

export const EffectsContext = React.createContext<mitt.Emitter | null>(null);

/**
 * Returns a component that will render your board wrapped in
 * an effect emitting context provider.
 * @param Board - The board component to wrap.
 *
 * @example
 * import { EffectsBoardWrapper } from 'bgio-effects'
 * import MyBoard from './board.js'
 * const BoardWithEffects = EffectsBoardWrapper(MyBoard)
 */
export function EffectsBoardWrapper<C extends EffectsPluginConfig>(
  Board: React.ComponentType<{ [key: string]: any }>
) {
  return function WrappedBoard(props: {
    plugins: { effects?: { data: Data<C['effects']> } };
  }) {
    <EffectsProvider plugins={props.plugins}>
      <Board {...props} />
    </EffectsProvider>;
  };
}

/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 */
export function useEffectListener(
  effectType: string,
  callback: (...args: any[]) => void
) {
  const emitter = useContext(EffectsContext);

  useEffect(() => {
    if (!emitter || !callback) return;

    let cbReturn: any;

    emitter.on(effectType, (...args) => {
      cbReturn = callback(...args);
    });

    return () => {
      emitter.off(name, callback);
      if (typeof cbReturn === 'function') cbReturn();
    };
  }, [emitter, effectType, callback]);
}

/**
 * Context provider that watches boardgame.io state and emits effect events.
 */
function EffectsProvider<C extends EffectsPluginConfig>({
  children,
  plugins,
}: {
  children: React.ReactNode;
  plugins: {
    effects?: {
      data: Data<C['effects']>;
    };
  };
}) {
  const [emitter] = useState(() => mitt());
  const [prevId, setPrevId] = useState<string>();
  const { effects } = plugins;
  const id = effects && effects.data.id;

  useEffect(() => {
    if (!effects || id === prevId) return;
    setPrevId(effects.data.id);
    const { queue } = effects.data;
    for (let i = 0; i < queue.length; i++) {
      const effect = queue[i] as { type: string; payload?: any };
      if (effect) emitter.emit(effect.type, effect.payload);
    }
  }, [effects, id, prevId]);

  return (
    <EffectsContext.Provider value={emitter}>
      {children}
    </EffectsContext.Provider>
  );
}
