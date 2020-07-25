import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import useRafLoop from 'react-use/lib/useRafLoop';
import useUpdate from 'react-use/lib/useUpdate';
import mitt, { Emitter } from 'mitt';
import type { BoardProps } from 'boardgame.io/react';
import type { EffectsPluginConfig, ListenerArgs, Data, Queue } from './types';

const EffectsContext = React.createContext<Emitter | null>(null);
const EffectsQueueContext = React.createContext<
  { clear: () => void; flush: () => void; size: number } | undefined
>(undefined);

/**
 * Configuration options that can be passed to EffectsBoardWrapper.
 */
interface EffectsOpts {
  speed?: number;
  updateStateAfterEffects?: boolean;
  emitOnFirstRender?: boolean;
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
 * Get an error message for when a hook has been used outside a provider.
 * @param hook - The name of the hook that errored.
 * @return - Error message string.
 */
const hookErrorMessage = (hook: string) =>
  `${hook} must be called inside the effects context provider.
  Make sure your board component has been correctly wrapped using EffectsBoardWrapper.`;

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
    if (!callback) return;

    let cbReturn: any;

    emitter.on(effectType as string, (...args) => {
      cbReturn = callback(...args);
    });

    return () => {
      emitter.off(effectType as string, callback as (...args: any) => any);
      if (typeof cbReturn === 'function') cbReturn();
    };
  }, [emitter, effectType, callback]);
}

/**
 * Get controls and data for the effects queue.
 * @return - { clear(), flush(), size }
 */
export function useEffectQueue() {
  const ctx = useContext(EffectsQueueContext);
  if (!ctx) throw new Error(hookErrorMessage('useEffectQueue'));
  return ctx;
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
  opts: {
    speed = 1,
    updateStateAfterEffects = false,
    emitOnFirstRender = false,
  } = {},
}: {
  Board: React.ComponentType<P>;
  props: P;
  opts?: EffectsOpts;
}) {
  type E = EffectsPluginConfig['effects'];
  type NaiveEffect = { t: number; type: string; payload?: any };
  const { effects } = props.plugins as { effects?: { data: Data<E> } };
  const id = effects && effects.data.id;
  const duration = (effects && effects.data.duration) || 0;
  const bgioStateT: number = updateStateAfterEffects ? duration : 0;
  const [prevId, setPrevId] = useState<string | undefined>(
    emitOnFirstRender ? undefined : id
  );
  const [emitter] = useState(() => mitt());
  const [startT, setStartT] = useState(0);
  const [bgioProps, setBgioProps] = useState(props);
  const queue = useRef<Queue<E>>([]);
  const rerender = useUpdate();
  const setQueue = useCallback(
    (newQueue: Queue<E>) => {
      queue.current = newQueue;
      rerender();
    },
    [queue, rerender]
  );

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
