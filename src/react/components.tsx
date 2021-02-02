import React, { useCallback, useEffect, useRef, useState } from 'react';
import useRafLoop from 'react-use/lib/useRafLoop';
import useUpdate from 'react-use/lib/useUpdate';
import mitt from 'mitt';
import type { Emitter } from 'mitt';
import type { BoardProps } from 'boardgame.io/react';
import type { Data, Queue } from '../types';
import type { InternalEffectShape } from './types';
import {
  EffectsContext,
  EffectsPropsContext,
  EffectsQueueContext,
} from './contexts';

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
  return function BoardWithEffectsProvider(boardProps: P) {
    return EffectsProvider<G, P>({ boardProps, Board, opts });
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
 * Emit an effect from the provided emitter, bundling payload and boardProps
 * into the effect object.
 */
function emit(
  emitter: Emitter,
  { type, payload }: Queue[number],
  boardProps: BoardProps
) {
  const effect: InternalEffectShape = { payload, boardProps };
  emitter.emit(type, effect);
}

/**
 * Dispatch all effects in the provided queue via the provided emitter.
 * @param emitter - Mitt instance.
 * @param effects - React ref for the effects queue to process.
 */
function emitAllEffects(
  emitter: Emitter,
  effects: React.MutableRefObject<Queue>,
  boardProps: BoardProps
) {
  for (const effect of effects.current) {
    emit(emitter, effect, boardProps);
  }
}

/**
 * Context provider that watches boardgame.io state and emits effect events.
 */
function EffectsProvider<
  G extends any = any,
  P extends BoardProps<G> = BoardProps<G>
>({
  Board,
  boardProps,
  opts: { speed = 1, updateStateAfterEffects = false } = {},
}: {
  Board: React.ComponentType<P>;
  boardProps: P;
  opts?: EffectsOpts;
}) {
  const { effects } = boardProps.plugins as { effects?: { data: Data } };
  const id = effects && effects.data.id;
  const duration = (effects && effects.data.duration) || 0;
  const bgioStateT: number = updateStateAfterEffects ? duration : 0;
  const [prevId, setPrevId] = useState<string | undefined>(id);
  const [emitter] = useState(() => mitt());
  const [endEmitter] = useState(() => mitt());
  const [startT, setStartT] = useState(0);
  const [bgioProps, setBgioProps] = useState(boardProps);
  const [queue, setQueue] = useRefState<Queue>([]);
  const [activeQueue, setActiveQueue] = useRefState<Queue>([]);

  /**
   * requestAnimationFrame loop which dispatches effects and updates the queue
   * every tick while active.
   */
  const [stopRaf, startRaf, isRafActive] = useRafLoop(() => {
    const elapsedT = ((performance.now() - startT) / 1000) * speed;
    const newActiveQueue: Queue = [];
    // Loop through the queue of active effects.
    let ended = false;
    for (let i = 0; i < activeQueue.current.length; i++) {
      const effect = activeQueue.current[i];
      if (effect.endT > elapsedT) {
        newActiveQueue.push(effect);
        continue;
      }
      emit(endEmitter, effect, boardProps);
      ended = true;
    }
    // Loop through the effects queue, emitting any effects whose time has come.
    let i = 0;
    for (i = 0; i < queue.current.length; i++) {
      const effect = queue.current[i];
      if (effect.t > elapsedT) break;
      emit(emitter, effect, boardProps);
      newActiveQueue.push(effect);
    }
    // Also update the global boardgame.io props once their time is reached.
    if (elapsedT >= bgioStateT && boardProps !== bgioProps)
      setBgioProps(boardProps);
    if (elapsedT > duration) stopRaf();
    // Update the queue to only contain effects still in the future.
    if (i > 0) setQueue(queue.current.slice(i));
    if (i > 0 || ended) setActiveQueue(newActiveQueue);
  }, false);

  /**
   * Update the queue state when a new update is received from boardgame.io.
   */
  useEffect(() => {
    if (!effects || id === prevId) {
      // If some non-game state props change, or the effects plugin is not
      // enabled, still update boardgame.io props for the board component.
      if (
        (!updateStateAfterEffects || !isRafActive()) &&
        boardProps !== bgioProps
      ) {
        setBgioProps(boardProps);
      }
      return;
    }
    setPrevId(effects.data.id);
    setQueue(effects.data.queue);
    emitAllEffects(endEmitter, activeQueue, boardProps);
    setActiveQueue([]);
    setStartT(performance.now());
    startRaf();
  }, [
    effects,
    id,
    prevId,
    updateStateAfterEffects,
    isRafActive,
    boardProps,
    bgioProps,
    setQueue,
    endEmitter,
    activeQueue,
    setActiveQueue,
    startRaf,
  ]);

  /**
   * Callback that clears the effect queue, cancelling future effects and
   * immediately calling any outstanding onEnd callbacks.
   */
  const clear = useCallback(() => {
    stopRaf();
    emitAllEffects(endEmitter, activeQueue, boardProps);
    setActiveQueue([]);
    setQueue([]);
    if (boardProps !== bgioProps) setBgioProps(boardProps);
  }, [
    stopRaf,
    endEmitter,
    activeQueue,
    setActiveQueue,
    setQueue,
    boardProps,
    bgioProps,
  ]);

  /**
   * Callback that immediately emits all remaining effects and clears the queue.
   * When flushing, onEnd callbacks are run immediately.
   */
  const flush = useCallback(() => {
    emitAllEffects(emitter, queue, boardProps);
    clear();
  }, [emitter, queue, clear, boardProps]);

  /**
   * Callback that updates the props to the latest props received
   */
  const update = useCallback(() => {
    if (boardProps !== bgioProps) setBgioProps(boardProps);
  }, [boardProps, bgioProps]);

  return (
    <EffectsContext.Provider value={{ emitter, endEmitter }}>
      <EffectsQueueContext.Provider
        value={{ clear, flush, update, size: queue.current.length }}
      >
        <EffectsPropsContext.Provider value={bgioProps}>
          <Board {...(bgioProps as P)} />
        </EffectsPropsContext.Provider>
      </EffectsQueueContext.Provider>
    </EffectsContext.Provider>
  );
}
