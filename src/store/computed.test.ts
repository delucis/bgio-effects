import { Store, ComputedStore } from '.';

let unsubscribe: () => void;
beforeEach(() => {
  unsubscribe = () => {};
});
afterEach(() => {
  unsubscribe();
});

describe('ComputedStore', () => {
  test('construction', () => {
    const store = new Store(1);
    const computed = new ComputedStore(store, (value) => value + 1);
    expect(computed.get()).toBe(2);
  });

  describe('#subscribe', () => {
    test('callback is called when the value changes', () => {
      const store = new Store(1);
      const computed = new ComputedStore(store, (value) => value + 1);
      const listener = jest.fn();
      unsubscribe = computed.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(2);
      store.set(2);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(3);
    });

    test('calls all subscribed callbacks', () => {
      const store = new Store(1);
      const computed = new ComputedStore(store, (value) => value + 1);
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsub1 = computed.subscribe(listener1);
      const unsub2 = computed.subscribe(listener2);
      unsubscribe = () => {
        unsub1();
        unsub2();
      };
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenLastCalledWith(2);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenLastCalledWith(2);
      store.set(2);
      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener1).toHaveBeenLastCalledWith(3);
      expect(listener2).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenLastCalledWith(3);
    });

    test('returns an unsubscribe method that stops callback being called again', () => {
      const store = new Store(1);
      const computed = new ComputedStore(store, (value) => value + 1);
      const listener = jest.fn();
      unsubscribe = computed.subscribe(listener);
      store.set(2);
      unsubscribe();
      store.set(3);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(3);
    });
  });
});
