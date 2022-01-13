import React, { useCallback, useEffect, useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import {
  EffectsContext,
  EffectsPropsContext,
  EffectsQueueContext,
} from './contexts';
import { InternalEffectsEmitter } from '../emitter/emitter';
import type { QueueAPI } from './types';
import { useStore } from './hooks/useStore';

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
  G = any,
  P extends BoardProps<G> = BoardProps<G>
>(Board: React.ComponentType<P>, opts?: EffectsOpts): React.ComponentType<P> {
  return function BoardWithEffectsProvider(boardProps: P) {
    return EffectsProvider<G, P>({ boardProps, Board, opts });
  };
}

/**
 * Context provider that watches boardgame.io state and emits effect events.
 */
function EffectsProvider<G = any, P extends BoardProps<G> = BoardProps<G>>({
  Board,
  boardProps,
  opts,
}: {
  Board: React.ComponentType<P>;
  boardProps: P;
  opts?: EffectsOpts;
}) {
  const [emitter] = useState(() => {
    const emitter = InternalEffectsEmitter<BoardProps>(opts);
    emitter.onUpdate(boardProps);
    return emitter;
  });
  // When props change, let the emitter handle the update.
  useEffect(() => emitter.onUpdate(boardProps), [boardProps, emitter]);

  /** Public API for manipulating the EffectsEmitter queue. */
  const queueAPI: QueueAPI = {
    /**
     * Callback that clears the effect queue, cancelling future effects and
     * immediately calling any outstanding onEnd callbacks.
     */
    clear: useCallback(() => emitter.clear(), [emitter]),
    /**
     * Callback that immediately emits all remaining effects and clears the queue.
     * When flushing, onEnd callbacks are run immediately.
     */
    flush: useCallback(() => emitter.flush(), [emitter]),
    /**
     * Callback that immediately updates the props to the latest props received.
     */
    update: useCallback(() => {
      emitter.state.set(boardProps);
    }, [emitter.state, boardProps]),
    /**
     * The number of effects currently in the queue.
     */
    size: useStore(emitter.size),
  };

  // Subscribe to the emitter's state and use it as the source of the board’s props.
  const bgioProps = useStore(emitter.state);
  const props = opts?.updateStateAfterEffects ? bgioProps! : boardProps;

  return (
    <EffectsContext.Provider value={emitter}>
      <EffectsQueueContext.Provider value={queueAPI}>
        <EffectsPropsContext.Provider value={props}>
          <Board {...(props as P)} />
        </EffectsPropsContext.Provider>
      </EffectsQueueContext.Provider>
    </EffectsContext.Provider>
  );
}
