import { useEffect, useState } from 'react';
import type { Store } from '../../store';

/** Hook that returns the current value of a store and keeps it updated. */
export function useStore<Value>(store: Store<Value>): Readonly<Value> {
  const [state, setState] = useState(store.get());
  useEffect(() => store.subscribe(setState), [store]);
  return state;
}
