import type { F, O, U } from 'ts-toolbelt';

/**
 * Object shape defining a single effect.
 */
interface EffectConfig {
  create?: (...args: any[]) => any;
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
      [K in keyof E]: E[K] extends { create: F.Function }
        ? {
            type: K;
            payload: F.Return<O.At<E[K], 'create'>>;
          }
        : E[K] extends { create?: undefined }
        ? { type: K }
        : never;
    }
  >
>;

/**
 * Type describing the EffectsPlugin data object.
 * @param E - A map of EffectConfig interfaces to derive the data from.
 */
export type Data<E extends EffectsMap> = {
  id: string;
  queue: Effect<E>[];
};

/**
 * Generic type for the EffectsPlugin API.
 * @param E - A tuple of EffectConfig interfaces to derive the API from.
 */
export type API<E extends EffectsMap> = {
  _get: () => Data<E>;
} & U.IntersectOf<
  O.UnionOf<
    {
      [K in keyof E]: E[K] extends { create: F.Function }
        ? O.Record<K, (...args: F.Parameters<O.At<E[K], 'create'>>) => void>
        : E[K] extends { create?: undefined }
        ? O.Record<K, () => void>
        : never;
    }
  >
>;
