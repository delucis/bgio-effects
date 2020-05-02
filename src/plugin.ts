import { nanoid } from 'nanoid/non-secure';
import type { Plugin } from 'boardgame.io';
import type { API, Data, Effect, EffectsPluginConfig } from './types';

/**
 * Generate the data template initialised for each game action.
 * @return - Object with a unique `id` & an empty `queue` array.
 */
const initialData = <E extends EffectsPluginConfig['effects']>(): Data<E> => ({
  id: nanoid(6),
  queue: [],
});

/**
 * Create a boardgame.io plugin that will provide an “effects” API.
 * @param config - Configuration object
 * @return - boardgame.io plugin object
 */
export const EffectsPlugin = <C extends EffectsPluginConfig>(config: C) => {
  type E = C['effects'];
  const plugin: Plugin<API<E>, Data<E>> = {
    name: 'effects',

    setup: initialData,

    api: () => {
      const _data = initialData<E>();
      const api = {} as Record<string, (...args: any[]) => any>;

      if (config) {
        for (let i = 0; i < config.effects.length; i++) {
          const { type, create } = config.effects[i];

          if (type === '_get') {
            throw new RangeError(
              'Cannot create effect type “_get”. Name is reserved.'
            );
          }

          api[type] = create
            ? (...args: Parameters<typeof create>) =>
                _data.queue.push({
                  type,
                  payload: create(...args),
                } as Effect<E>)
            : () => _data.queue.push({ type } as Effect<E>);
        }
      }

      return {
        ...api,
        _get: () => _data,
      } as API<E>;
    },

    flush: ({ api }) => api._get(),
  };

  return plugin;
};
