import type { BoardProps } from 'boardgame.io/react';
import { useEffect, useState } from 'react';
import { useEffectListener } from './useEffectListener';
import { useBoardProps } from './useBoardProps';

/**
 * Returns the latest board props when one or more effect
 * is triggered. Essentially sugar around `useEffectListener`.
 * @param effectTypes - List of effects to subscribe to.
 * @return The boardgame.io props including G and ctx
 */
export function useLatestPropsOnEffect(...effectTypes: Array<string>) {
  const boardProps = useBoardProps();
  const [props, setProps] = useState(boardProps);

  useEffectListener(
    '*',
    (effectName: string, _payload: any, boardProps: BoardProps) => {
      if (effectTypes.includes(effectName) || effectTypes.includes('*')) {
        setProps(boardProps);
      }
    },
    [effectTypes]
  );

  useEffect(() => {
    setProps(boardProps);
  }, [boardProps]);

  return props;
}
