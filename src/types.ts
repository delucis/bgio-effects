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
 * Type describing the possible effect objects produced by an EffectsPlugin.
 * @param E - A map of EffectConfig interfaces to derive the shapes from.
 */
export type Effect<E extends EffectsMap> =
  | U.IntersectOf<
      O.UnionOf<
        {
          [K in keyof E]: E[K] extends EffectWithCreate
            ? {
                type: K;
                payload: EffectPayload<E[K]>;
              }
            : E[K] extends EffectWithoutCreate
            ? { type: K }
            : never;
        }
      >
    >
  | { type: BuiltinEffect };

/**
 * Type describing the queue of effects persisted to game state.
 * @param E - A map of EffectConfig interfaces to derive the data from.
 */
export type Queue<E extends EffectsMap> = Array<Effect<E> & { t: number }>;

/**
 * Type describing the EffectsPlugin data object.
 * @param E - A map of EffectConfig interfaces to derive the data from.
 */
export type Data<E extends EffectsMap> = {
  id: string;
  duration: number;
  queue: Queue<E>;
};

type Duration = number;
type Position = number | string;
export type TimingParams = [Position, Duration];

/**
 * Generic type for the EffectsPlugin API.
 * @param E - A tuple of EffectConfig interfaces to derive the API from.
 */
export type API<E extends EffectsMap> = {
  timeline: Timeline<E>;
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

type CbReturn = void | (() => void);
export type ListenerArgs<E extends EffectsMap> =
  | [
      '*',
      (
        ...cbArgs: O.UnionOf<
          {
            [K in keyof E]: E[K] extends EffectWithCreate
              ? [K, EffectPayload<E[K]>]
              : [K, undefined];
          }
        >
      ) => CbReturn,
      React.DependencyList
    ]
  | O.UnionOf<
      {
        [K in keyof E]: [
          K,
          E[K] extends EffectWithCreate
            ? (payload: EffectPayload<E[K]>) => CbReturn
            : () => CbReturn,
          React.DependencyList
        ];
      }
    >
  | [BuiltinEffect, () => CbReturn, React.DependencyList];
