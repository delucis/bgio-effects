import type { F, O, U } from 'ts-toolbelt';

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
 * Type describing the possible effect objects produced by an EffectsPlugin.
 * @param E - A map of EffectConfig interfaces to derive the shapes from.
 */
export type Effect<E extends EffectsMap> = U.IntersectOf<
  O.UnionOf<
    {
      [K in keyof E]: E[K] extends EffectWithCreate
        ? {
            type: K;
            payload: F.Return<O.At<E[K], 'create'>>;
          }
        : E[K] extends EffectWithoutCreate
        ? { type: K }
        : never;
    }
  >
>;

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
  timeline: {
    /**
     * Get an array of all the currently queued effects in time order.
     */
    getQueue: () => Queue<E>;

    /**
     * Clear all effects from the queue.
     */
    clear: () => void;

    /**
     * Check if no effects have been queued.
     */
    isEmpty: () => boolean;

    /**
     * Get the total duration of the current timeline.
     */
    duration: () => number;
  };
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
              ? [K, F.Return<O.At<E[K], 'create'>>]
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
            ? (payload: F.Return<O.At<E[K], 'create'>>) => CbReturn
            : () => CbReturn,
          React.DependencyList
        ];
      }
    >;
