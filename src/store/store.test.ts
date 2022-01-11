import { Store } from '.';

let unsubscribe: () => void;
beforeEach(() => {
  unsubscribe = () => {};
});
afterEach(() => {
  unsubscribe();
});

describe('Store', () => {
  test('construction', () => {
    const store = new Store(1);
    expect(store.get()).toBe(1);
  });

  describe('#subscribe', () => {
    test('callback is called when the value changes', () => {
      const store = new Store(1);
      const listener = jest.fn();
      unsubscribe = store.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(1);
      store.set(2);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(2);
    });

    test('returns an unsubscribe method that stops callback being called again', () => {
      const store = new Store(1);
      const listener = jest.fn();
      unsubscribe = store.subscribe(listener);
      store.set(2);
      unsubscribe();
      store.set(3);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(2);
    });
  });

  describe('#set', () => {
    test('updates value', () => {
      const store = new Store(1);
      expect(store.get()).toBe(1);
      store.set(2);
      expect(store.get()).toBe(2);
    });

    test('doesn’t notify subscribers if value hasn’t changed', () => {
      const store = new Store(1);
      const listener = jest.fn();
      unsubscribe = store.subscribe(listener);
      store.set(1);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(1);
    });
  });

  describe('#get', () => {
    test('returns current value', () => {
      const store = new Store(1);
      expect(store.get()).toBe(1);
    });
  });
});
