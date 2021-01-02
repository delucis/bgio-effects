import React, { useCallback, useEffect, useRef, useState } from 'react';
import useRafLoop from 'react-use/lib/useRafLoop';
import useUpdate from 'react-use/lib/useUpdate';
import mitt from 'mitt';
import type { BoardProps } from 'boardgame.io/react';
import type { Data, Queue } from '../types';
import { EffectsContext, EffectsQueueContext } from './contexts';

/**
 * Configuration options that can be passed to EffectsBoardWrapper.
 */
interface EffectsOpts {
  speed?: number;
  updateStateAfterEffects?: boolean;
}

/**
 * Returns a component that will render your board wrapped in
 * an effect emitting context provider.
 * @param board - The board component to wrap.
 * @param opts  - Optional object to configure options for effect emitter.
 *
 * @example
 * import { EffectsBoardWrapper } from 'bgio-effects'
 * import MyBoard from './board.js'
 * const BoardWithEffects = EffectsBoardWrapper(MyBoard)
 */
export function EffectsBoardWrapper<
  G extends any = any,
  P extends BoardProps<G> = BoardProps<G>
>(Board: React.ComponentType<P>, opts?: EffectsOpts): React.ComponentType<P> {
  return function BoardWithEffectsProvider(props: P) {
    return EffectsProvider<G, P>({ props, Board, opts });
  };
}

/**
 * Hook very similar to `useState` except that state is stored in a ref.
 * This allows the requestAnimationFrame loop to access the latest state
 * before React rerenders, but also update React as `setState` would usually.
 */
function useRefState<T>(initial: T) {
  const state = useRef(initial);
  const rerender = useUpdate();
  const setState = useCallback(
    (newState: T) => {
      state.current = newState;
      rerender();
    },
    [state, rerender]
  );
  return [state, setState] as const;
}

/**
 * Context provider that watches boardgame.io state and emits effect events.
 */
function EffectsProvider<
  G extends any = any,
  P extends BoardProps<G> = BoardProps<G>
>({
  Board,
  props,
  opts: { speed = 1, updateStateAfterEffects = false } = {},
}: {
  Board: React.ComponentType<P>;
  props: P;
  opts?: EffectsOpts;
}) {
  type NaiveEffect = { t: number; type: string; payload?: any };
  const { effects } = props.plugins as { effects?: { data: Data } };
  const id = effects && effects.data.id;
  const duration = (effects && effects.data.duration) || 0;
  const bgioStateT: number = updateStateAfterEffects ? duration : 0;
  const [prevId, setPrevId] = useState<string | undefined>(id);
  const [emitter] = useState(() => mitt());
  const [startT, setStartT] = useState(0);
  const [bgioProps, setBgioProps] = useState(props);
  const [queue, setQueue] = useRefState<Queue>([]);

  /**
   * requestAnimationFrame loop which dispatches effects and updates the queue
   * every tick while active.
   */
  const [stopRaf, startRaf, isRafActive] = useRafLoop(() => {
    const elapsedT = ((performance.now() - startT) / 1000) * speed;
    const q = queue.current;
    // Loop through the effects queue, emitting any effects whose time has come.
    let i = 0;
    for (i = 0; i < q.length; i++) {
      const effect = q[i] as NaiveEffect;
      if (!effect || effect.t > elapsedT) break;
      emitter.emit(effect.type, effect.payload);
    }
    // Also update the global boardgame.io props once their time is reached.
    if (elapsedT >= bgioStateT && props !== bgioProps) setBgioProps(props);
    if (elapsedT > duration) stopRaf();
    // Update the queue to only contain effects still in the future.
    if (i > 0) setQueue(q.slice(i));
  }, false);

  /**
   * Update the queue state when a new update is received from boardgame.io.
   */
  useEffect(() => {
    if (!effects || id === prevId) {
      // If some non-game state props change, or the effects plugin is not
      // enabled, still update boardgame.io props for the board component.
      if ((!updateStateAfterEffects || !isRafActive()) && props !== bgioProps) {
        setBgioProps(props);
      }
      return;
    }
    setPrevId(effects.data.id);
    setQueue(effects.data.queue);
    setStartT(performance.now());
    startRaf();
  }, [
    effects,
    id,
    prevId,
    updateStateAfterEffects,
    isRafActive,
    props,
    bgioProps,
    setQueue,
    startRaf,
  ]);

  /**
   * Callback that clears the effect queue, cancelling future effects.
   */
  const clear = useCallback(() => {
    stopRaf();
    setQueue([]);
    if (props !== bgioProps) setBgioProps(props);
  }, [props, bgioProps, stopRaf, setQueue]);

  /**
   * Callback that immediately emits all remaining effects and clears the queue.
   */
  const flush = useCallback(() => {
    for (let i = 0; i < queue.current.length; i++) {
      const effect = queue.current[i] as NaiveEffect;
      emitter.emit(effect.type, effect.payload);
    }
    clear();
  }, [emitter, queue, clear]);

  return (
    <EffectsContext.Provider value={emitter}>
      <EffectsQueueContext.Provider
        value={{ clear, flush, size: queue.current.length }}
      >
        <Board {...(bgioProps as P)} />
      </EffectsQueueContext.Provider>
    </EffectsContext.Provider>
  );
}
