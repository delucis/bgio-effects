import type { F, O, U } from 'ts-toolbelt';

/**
 * Object shape defining a single effect.
 */
interface EffectConfig {
  type: string;
  create?: (...args: any[]) => any;
}

/**
 * Plugin configuration object shape.
 */
export interface EffectsPluginConfig {
  effects: readonly EffectConfig[];
}

/**
 * Type describing the possible effect objects produced by an EffectsPlugin.
 * @param E - A tuple of EffectConfig interfaces to derive the shapes from.
 */
export type Effect<E extends ReadonlyArray<EffectConfig>> = U.IntersectOf<
  O.UnionOf<
    {
      [K in Exclude<keyof E, keyof any[]>]: E[K] extends {
        type: string;
        create: F.Function;
      }
        ? {
            type: O.At<E[K], 'type'>;
            payload: F.Return<O.At<E[K], 'create'>>;
          }
        : E[K] extends {
            type: string;
            create?: undefined;
          }
        ? {
            type: O.At<E[K], 'type'>;
          }
        : never;
    }
  >
>;

/**
 * Type describing the EffectsPlugin data object.
 * @param E - A tuple of EffectConfig interfaces to derive the data from.
 */
export type Data<E extends ReadonlyArray<EffectConfig>> = {
  id: string;
  queue: Effect<E>[];
};

/**
 * Generic type for the EffectsPlugin API.
 * @param E - A tuple of EffectConfig interfaces to derive the API from.
 */
export type API<E extends ReadonlyArray<EffectConfig>> = {
  _get: () => Data<E>;
} & U.IntersectOf<
  O.UnionOf<
    {
      [K in Exclude<keyof E, keyof any[]>]: E[K] extends {
        type: string;
        create: F.Function;
      }
        ? O.Record<
            O.At<E[K], 'type'>,
            (...args: F.Parameters<O.At<E[K], 'create'>>) => void
          >
        : E[K] extends {
            type: string;
            create?: undefined;
          }
        ? O.Record<O.At<E[K], 'type'>, () => void>
        : never;
    }
  >
>;
