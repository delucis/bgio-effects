import type { BoardProps } from 'boardgame.io/react';
import { useEffect, useRef, useState } from 'react';
import { useEffectListener } from './useEffectListener';
import { useBoardProps } from './useBoardProps';
import type { BuiltinEffect, EffectsPluginConfig } from '../../types';

type EffectType<C extends EffectsPluginConfig> =
  | BuiltinEffect
  | '*'
  | keyof C['effects'];

/**
 * Returns the latest board props when one or more effect
 * is triggered. Essentially sugar around `useEffectListener`.
 * @param effectTypes - List of effects to subscribe to.
 * @return The boardgame.io props including G and ctx
 */
export function useLatestPropsOnEffect<
  G = any,
  C extends EffectsPluginConfig = EffectsPluginConfig
>(...effectTypes: EffectType<C>[]): BoardProps<G> {
  const boardProps = useBoardProps();
  const [props, setProps] = useState(boardProps);
  const effects = useRef(effectTypes);

  if (
    effectTypes.length !== effects.current.length ||
    !effects.current.every((v, i) => v === effectTypes[i])
  ) {
    effects.current = effectTypes;
  }

  useEffectListener(
    '*',
    (effectName: string, _payload: any, boardProps: BoardProps) => {
      if (
        effects.current.includes(effectName) ||
        effects.current.includes('*')
      ) {
        setProps(boardProps);
      }
    },
    [effects]
  );

  useEffect(() => {
    setProps(boardProps);
  }, [boardProps]);

  return props;
}
