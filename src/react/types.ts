import type { O } from 'ts-toolbelt';
import type { BoardProps } from 'boardgame.io/react';
import {
  BuiltinEffect,
  EffectsMap,
  EffectWithCreate,
  EffectPayload,
} from '../types';

/**
 * Return type for all effect listener callbacks.
 */
type CbReturn = void | (() => void);

/**
 * Context object passed to all callbacks in addition to the effect payload.
 * Currently this is the entire board props object, containing G etc.
 */
type EffectCbContext<G extends any> = BoardProps<G>;

/**
 * Type of callback when listening for all effects with '*'.
 */
type AllEffectsCb<E extends EffectsMap, G extends any> = (
  ...cbArgs: O.UnionOf<
    {
      [K in keyof E]: E[K] extends EffectWithCreate
        ? [K, EffectPayload<E[K]>, EffectCbContext<G>]
        : [K, undefined, EffectCbContext<G>];
    }
  >
) => CbReturn;

/**
 * Type of callback when listening for a specific effect.
 */
type EffectCb<
  E extends EffectsMap,
  K extends keyof E,
  G extends any
> = E[K] extends EffectWithCreate
  ? (payload: EffectPayload<E[K]>, context: EffectCbContext<G>) => CbReturn
  : (payload: undefined, context: EffectCbContext<G>) => CbReturn;

export type ListenerArgs<E extends EffectsMap, G extends any> =
  | ['*', AllEffectsCb<E, G>, React.DependencyList]
  | [
      '*',
      AllEffectsCb<E, G>,
      React.DependencyList,
      AllEffectsCb<E, G>,
      React.DependencyList
    ]
  | O.UnionOf<
      {
        [K in keyof E]:
          | [K, EffectCb<E, K, G>, React.DependencyList]
          | [
              K,
              EffectCb<E, K, G>,
              React.DependencyList,
              EffectCb<E, K, G>,
              React.DependencyList
            ];
      }
    >
  | [BuiltinEffect, () => CbReturn, React.DependencyList];

/**
 * Shape of the effect objects emitted internally through mitt.
 * This is then destructured to pass to the effect listener.
 */
export interface InternalEffectShape {
  payload: any;
  boardProps: EffectCbContext<any>;
}
