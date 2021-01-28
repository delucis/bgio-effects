import { useEffect, useState } from 'react';
import { useEffectListener } from './useEffectListener';
import { useBoardProps } from './useBoardProps';

/**
 * Subscribe to a part of the board state, ignores any payload
 * This hook is sugar around `useEffectListener` and `useState`.
 * @param effectType - Name of the effect to subscribe to.
 * @param getState - pure function that takes the board props as params
 * and returns the part of state to watch
 * @return - Tuple of `[effectState: any, isActive: boolean]`.
 * `effectState` initial value will be taken from the initial board props.
 * `isActive` is true for the length of the effect’s duration.
 */
export function useWatchedState(effectType: any, getState: any) {
  const boardProps = useBoardProps();
  const [state, setState] = useState(getState(boardProps));
  const [isActive, setIsActive] = useState(false);

  useEffectListener(
    effectType,
    ({}, boardProps: any) => {
      setState(getState(boardProps));
      setIsActive(true);
    },
    [],
    () => setIsActive(false),
    []
  );

  useEffect(() => {
    setState(getState(boardProps));
  }, [boardProps]);

  return [state, isActive];
}
