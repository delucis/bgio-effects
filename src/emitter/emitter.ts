import mitt from 'mitt';
import type { Emitter, Handler, WildcardHandler } from 'mitt';
import type { Client } from 'boardgame.io/client';
import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import { Store, ComputedStore, ReadonlyStore } from '../store';
import type { InternalEffectShape, Queue } from '../types';
import { RafRunner } from './raf-runner';

interface EffectsEmitterOptions {
  speed?: number;
  updateStateAfterEffects?: boolean;
}

type Listener<S extends ClientState> = Handler<
  InternalEffectShape<Exclude<S, null>>
>;
type WildcardListener<S extends ClientState> = WildcardHandler<
  Record<string, InternalEffectShape<Exclude<S, null>>>
>;

export interface EffectsEmitter<S extends ClientState> {
  /**
   * Register listeners for a specific effect type (or the wildcard effect `'*'`).
   * @returns An unsubscribe function.
   */
  on(
    effect: '*',
    callback?: WildcardListener<S>,
    onEndCallback?: WildcardListener<S>
  ): () => void;
  on(
    effect: Exclude<string, '*'>,
    callback?: Listener<S>,
    onEndCallback?: Listener<any>
  ): () => void;
  clear(): void;
  flush(): void;
  size: ReadonlyStore<number>;
}

class EffectsEmitterImpl<S extends ClientState> implements EffectsEmitter<S> {
  private readonly emitter =
    mitt<Record<string, InternalEffectShape<Exclude<S, null>>>>();
  private readonly endEmitter =
    mitt<Record<string, InternalEffectShape<Exclude<S, null>>>>();
  private readonly raf = new RafRunner(() => this.onRaf());
  private readonly queue = new Store<Queue>([]);
  private activeQueue: Queue = [];
  private latestState: S | null = null;
  private prevId?: string;
  private startT = 0;
  private duration = 0;

  /**
   * Store for the current boardgame.io client state.
   */
  public readonly state = new Store<S | null>(null);

  constructor(
    private readonly speed: number = 1,
    private readonly updateStateAfterEffects: boolean = false
  ) {}

  // TODO: Call callbacks with [payload, state] instead of [{payload, state}]
  on(
    effect: '*',
    callback?: WildcardListener<S>,
    onEndCallback?: WildcardListener<S>
  ): () => void;
  on(
    effect: Exclude<string, '*'>,
    callback?: Listener<S>,
    onEndCallback?: Listener<S>
  ): () => void;
  on(
    effect: string,
    callback?: Listener<S> | WildcardListener<S>,
    onEndCallback?: Listener<any> | WildcardListener<S>
  ): () => void {
    if (callback) this.emitter.on(effect, callback as Listener<S>);
    if (onEndCallback) this.endEmitter.on(effect, onEndCallback as Listener<S>);
    return (): void => this.off(effect, callback, onEndCallback);
  }

  private off(
    effect: string,
    callback?: Listener<S> | WildcardListener<S>,
    onEndCallback?: Listener<any> | WildcardListener<S>
  ): void {
    this.emitter.off(effect, callback as Listener<S>);
    this.endEmitter.off(effect, onEndCallback as Listener<S>);
  }

  /**
   * Callback that clears the effect queue, cancelling future effects and
   * immediately calling any outstanding onEnd callbacks.
   */
  public clear(): void {
    this.raf.stop();
    this.emitAllEffects(this.endEmitter, this.activeQueue);
    this.queue.set([]);
    this.activeQueue = [];
    if (this.state.get() !== this.latestState) this.state.set(this.latestState);
  }

  /**
   * Callback that immediately emits all remaining effects and clears the queue.
   * When flushing, onEnd callbacks are run immediately.
   */
  public flush(): void {
    this.emitAllEffects(this.emitter, this.queue.get());
    this.clear();
  }

  /** Get the number of effects currently queued to be emitted. */
  public size = new ComputedStore(this.queue, (queue) => queue.length);

  /**
   * Update the queue state when a new state update is received from boardgame.io.
   */
  public onUpdate(state: null | S): void {
    if (!state) return;
    const { effects } = state.plugins;
    if (!effects) return;
    if (effects.data.id === this.prevId) return;
    this.prevId = effects.data.id;
    this.queue.set(effects.data.queue);
    this.activeQueue = [];
    this.startT = performance.now();
    this.duration = effects.data.duration;
    this.latestState = state;
    this.raf.start();
  }

  /**
   * requestAnimationFrame loop which dispatches effects and updates the queue
   * every tick while active.
   */
  private onRaf(): void {
    const elapsedT = ((performance.now() - this.startT) / 1000) * this.speed;
    const newActiveQueue: Queue = [];
    // Loop through the queue of active effects.
    let ended = false;
    for (const effect of this.activeQueue) {
      if (effect.endT > elapsedT) {
        newActiveQueue.push(effect);
        continue;
      }
      this.emit(this.endEmitter, effect);
      ended = true;
    }
    // Loop through the effects queue, emitting any effects whose time has come.
    const queue = this.queue.get();
    let i = 0;
    for (i = 0; i < queue.length; i++) {
      const effect = queue[i];
      if (effect.t > elapsedT) break;
      this.emit(this.emitter, effect);
      newActiveQueue.push(effect);
    }
    // Also update the global boardgame.io props once their time is reached.
    const bgioStateT = this.updateStateAfterEffects ? this.duration : 0;
    if (elapsedT >= bgioStateT && this.state.get() !== this.latestState)
      this.state.set(this.latestState);
    if (elapsedT > this.duration) this.raf.stop();
    // Update the queue to only contain effects still in the future.
    if (i > 0) this.queue.set(queue.slice(i));
    if (i > 0 || ended) this.activeQueue = newActiveQueue;
  }

  /**
   * Emit an effect from the provided emitter, bundling payload and boardProps
   * into the effect object.
   */
  private emit(emitter: Emitter<any>, { type, payload }: Queue[number]) {
    const effect: InternalEffectShape = {
      payload,
      boardProps: this.latestState!,
    };
    emitter.emit(type, effect);
  }

  /**
   * Dispatch all effects in the provided queue via the provided emitter.
   * @param emitter - Mitt instance.
   * @param effects - Effects queue to process.
   */
  private emitAllEffects(emitter: Emitter<any>, effects: Readonly<Queue>) {
    for (const effect of effects) {
      this.emit(emitter, effect);
    }
  }
}

export function InternalEffectsEmitter<S extends ClientState>({
  speed,
  updateStateAfterEffects,
}: EffectsEmitterOptions = {}): EffectsEmitterImpl<S> {
  return new EffectsEmitterImpl<S>(speed, updateStateAfterEffects);
}

export function EffectsEmitter(
  client: { subscribe: ReturnType<typeof Client>['subscribe'] },
  opts?: EffectsEmitterOptions
): EffectsEmitter<ClientState> {
  const emitter = InternalEffectsEmitter(opts);
  client.subscribe(emitter.onUpdate.bind(emitter));
  return emitter;
}
