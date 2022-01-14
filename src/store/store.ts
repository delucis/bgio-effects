import mitt from 'mitt';
import { Handler } from 'mitt';

/** Simple value store with subscribe method to listen for changes. */
export class Store<Value> {
  private static readonly Event = 'change';
  private readonly mitt = mitt<Record<typeof Store.Event, Readonly<Value>>>();
  constructor(private value: Value) {}

  protected get hasSubscribers(): boolean {
    const subscribers = this.mitt.all.get(Store.Event);
    return subscribers !== undefined && subscribers.length > 0;
  }

  /**
   * Subscribe to updates of the store value.
   * @returns An unsubscribe function.
   */
  subscribe(handler: Handler<Readonly<Value>>): () => void {
    this.mitt.on(Store.Event, handler);
    handler(this.value);
    return () => this.mitt.off(Store.Event, handler);
  }

  /** Update the stored value, notifying all subscribers if it changed. */
  set(value: Value): void {
    if (this.value === value) return;
    this.value = value;
    this.mitt.emit(Store.Event, value);
  }

  /** Get the currently stored value. */
  get(): Readonly<Value> {
    return this.value;
  }
}
