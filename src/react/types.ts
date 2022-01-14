import type { O } from 'ts-toolbelt';
import type { BoardProps } from 'boardgame.io/react';
import type {
  BuiltinEffect,
  EffectsMap,
  EffectWithCreate,
  EffectPayload,
} from '../types';

/**
 * Interface provided by the `useEffectQueue` hook for manipulating
 * the current effect queue.
 */
export interface QueueAPI {
  clear: () => void;
  flush: () => void;
  update: () => void;
  size: number;
}

/**
 * Return type for all effect listener callbacks.
 */
type CbReturn = void | (() => void);

/**
 * Type of callback when listening for all effects with '*'.
 */
type AllEffectsCb<E extends EffectsMap, G> = (
  ...cbArgs: O.UnionOf<{
    [K in keyof E]: E[K] extends EffectWithCreate
      ? [K, EffectPayload<E[K]>, BoardProps<G>]
      : [K, undefined, BoardProps<G>];
  }>
) => CbReturn;

/**
 * Type of callback when listening for a specific effect.
 */
type EffectCb<
  E extends EffectsMap,
  K extends keyof E,
  G
> = E[K] extends EffectWithCreate
  ? (payload: EffectPayload<E[K]>, context: BoardProps<G>) => CbReturn
  : (payload: undefined, context: BoardProps<G>) => CbReturn;

export type ListenerArgs<E extends EffectsMap, G> =
  | ['*', AllEffectsCb<E, G>, React.DependencyList]
  | [
      '*',
      AllEffectsCb<E, G>,
      React.DependencyList,
      AllEffectsCb<E, G>,
      React.DependencyList
    ]
  | O.UnionOf<{
      [K in keyof E]:
        | [K, EffectCb<E, K, G>, React.DependencyList]
        | [
            K,
            EffectCb<E, K, G>,
            React.DependencyList,
            EffectCb<E, K, G>,
            React.DependencyList
          ];
    }>
  | [BuiltinEffect, () => CbReturn, React.DependencyList];
