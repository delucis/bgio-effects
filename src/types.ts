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
export interface EffectWithCreate extends EffectConfig {
  create: CreateFn;
}
interface EffectWithoutCreate extends EffectConfig {
  create?: undefined;
}

/**
 * Extract the payload that results from a single effect’s `create` definiton.
 */
export type EffectPayload<E extends EffectWithCreate> = F.Return<
  O.At<E, 'create'>
>;

/**
 * Extract the payload that results from any single effect.
 */
export type EffectState<E extends EffectConfig> = E extends EffectWithCreate
  ? EffectPayload<E>
  : undefined;

/**
 * Map of effect name strings to EffectConfig interfaces.
 */
export type EffectsMap = Record<string, EffectConfig>;

/**
 * Plugin configuration object shape.
 */
export interface EffectsPluginConfig {
  effects: EffectsMap;
}

/**
 * Effect types generated by the plugin itself.
 */
export type BuiltinEffect = 'effects:start' | 'effects:end';

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
  O.UnionOf<{
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
  }>
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
