import type { Handler } from 'mitt';
import { Store } from './store';

/** Store whose value is derived from that of another `Store` */
export class ComputedStore<ComputedValue, Value> extends Store<ComputedValue> {
  private unsubscribe?: () => void;

  constructor(
    private readonly store: Store<Value>,
    private readonly selector: (value: Readonly<Value>) => ComputedValue
  ) {
    // Initialise stored value using current parent store value.
    super(selector(store.get()));
  }

  /** Initiate subscription to parent store if necessary. */
  private start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.store.subscribe((value) => {
      this.set(this.selector(value));
    });
  }

  /** Unsubscribe from parent store if no-one is subscribed to computed state. */
  private stop(): void {
    if (!this.unsubscribe || this.hasSubscribers) return;
    this.unsubscribe();
    delete this.unsubscribe;
  }

  /**
   * Subscribe to updates of the stored value.
   * @returns An unsubscribe function.
   */
  subscribe(handler: Handler<Readonly<ComputedValue>>): () => void {
    this.start();
    const unsubscribe = super.subscribe(handler);
    return () => {
      unsubscribe();
      this.stop();
    };
  }

  /** Get the currently stored value. */
  get(): Readonly<ComputedValue> {
    // Compute the current value on demand. This could be inefficient if the
    // selector were expensive, but that’s not the case for our usage.
    return this.selector(this.store.get());
  }
}

/** Value store. `subscribe` for updates, or `get` the current value. */
export type ReadonlyStore<Value> = Omit<Store<Value>, 'set'>;
