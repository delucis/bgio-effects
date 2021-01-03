import type { F, O, U } from 'ts-toolbelt';
import type { Timeline } from './timeline';

/**
 * Type of effect.create function.
 */
type CreateFn = (arg: any) => any;

/**
 * Object shape defining a single effect.
 */
interface EffectConfig {
  create?: CreateFn;
  duration?: number;
}
interface EffectWithCreate extends EffectConfig {
  create: CreateFn;
}
interface EffectWithoutCreate extends EffectConfig {
  create?: undefined;
}

/**
 * Extract the payload that results from a single effect’s `create` definiton.
 */
type EffectPayload<E extends EffectWithCreate> = F.Return<O.At<E, 'create'>>;

/**
 * Map of effect name strings to EffectConfig interfaces.
 */
type EffectsMap = Record<string, EffectConfig>;

/**
 * Plugin configuration object shape.
 */
export interface EffectsPluginConfig {
  effects: EffectsMap;
}

/**
 * Effect types generated by the plugin itself.
 */
type BuiltinEffect = 'effects:start' | 'effects:end';

/**
 * Type describing the effect objects produced by the EffectsPlugin.
 */
export interface Effect {
  type: string;
  payload?: any;
}

/**
 * Type describing an effect when persisted to the game state.
 */
interface PersistedEffect extends Effect {
  t: number;
  endT: number;
}

/**
 * Type describing the queue of effects persisted to game state.
 */
export type Queue = PersistedEffect[];

/**
 * Type describing the EffectsPlugin data object.
 */
export interface Data {
  id: string;
  duration: number;
  queue: Queue;
}

type Duration = number;
type Position = number | string;
export type TimingParams = [Position, Duration];

/**
 * Generic type for the EffectsPlugin API.
 * @param E - A tuple of EffectConfig interfaces to derive the API from.
 */
export type API<E extends EffectsMap> = {
  timeline: Timeline;
} & U.IntersectOf<
  O.UnionOf<
    {
      [K in keyof E]: E[K] extends EffectWithCreate
        ? O.Record<
            K,
            (
              arg: F.Parameters<O.At<E[K], 'create'>>[0],
              position?: TimingParams[0],
              duration?: TimingParams[1]
            ) => void
          >
        : E[K] extends EffectWithoutCreate
        ? O.Record<
            K,
            (position?: TimingParams[0], duration?: TimingParams[1]) => void
          >
        : never;
    }
  >
>;

/**
 * Effects plugin API mixin to intersect with boardgame.io `Ctx` type.
 * @example
 * import { Game, Ctx } from 'boardgame.io';
 * import { EffectsCtxMixin } from 'bgio-effects';
 *
 * const EffectsConfig = {
 *   effects: {
 *     explode: {}
 *   }
 * } as const;
 *
 * const game: Game<any, Ctx & EffectsCtxMixin<typeof EffectsConfig>> = {
 *   moves: {
 *     A: (G, ctx) => ctx.effects.explode(), // fully typed
 *   }
 * };
 */
export type EffectsCtxMixin<C extends EffectsPluginConfig> = {
  effects: API<C['effects']>;
};

/**
 * Return type for all effect listener callbacks.
 */
type CbReturn = void | (() => void);

/**
 * Type of callback when listening for all effects with '*'.
 */
type AllEffectsCb<E extends EffectsMap> = (
  ...cbArgs: O.UnionOf<
    {
      [K in keyof E]: E[K] extends EffectWithCreate
        ? [K, EffectPayload<E[K]>]
        : [K, undefined];
    }
  >
) => CbReturn;

/**
 * Type of callback when listening for a specific effect.
 */
type EffectCb<
  E extends EffectsMap,
  K extends keyof E
> = E[K] extends EffectWithCreate
  ? (payload: EffectPayload<E[K]>) => CbReturn
  : () => CbReturn;

export type ListenerArgs<E extends EffectsMap> =
  | ['*', AllEffectsCb<E>, React.DependencyList]
  | [
      '*',
      AllEffectsCb<E>,
      React.DependencyList,
      AllEffectsCb<E>,
      React.DependencyList
    ]
  | O.UnionOf<
      {
        [K in keyof E]:
          | [K, EffectCb<E, K>, React.DependencyList]
          | [
              K,
              EffectCb<E, K>,
              React.DependencyList,
              EffectCb<E, K>,
              React.DependencyList
            ];
      }
    >
  | [BuiltinEffect, () => CbReturn, React.DependencyList];
