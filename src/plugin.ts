import { nanoid } from 'nanoid/non-secure';
import type { Plugin } from 'boardgame.io';
import { Timeline } from './timeline';
import type { API, Data, EffectsPluginConfig } from './types';

/**
 * Generate the data POJO to persist from a Timeline instance.
 * @return - Object with a unique `id`, `duration` in seconds & `queue` array.
 */
const getData = <E extends EffectsPluginConfig['effects']>(
  timeline: Timeline<E>
): Data<E> => ({
  id: nanoid(8),
  duration: timeline.duration(),
  queue: timeline.getQueue(),
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

    setup: () => getData(new Timeline()),

    api: () => {
      const api = { timeline: new Timeline() } as Record<string, any>;

      for (const type in config.effects) {
        if (type === 'timeline') {
          throw new RangeError(
            'Cannot create effect type “timeline”. Name is reserved.'
          );
        }

        const { create, duration: defaultDuration } = config.effects[type];

        api[type] = (...args: any[]) => {
          const effect = create ? { type, payload: create(args[0]) } : { type };
          const [position, duration = defaultDuration] = create
            ? args.slice(1)
            : args;
          api.timeline.add(effect, position, duration);
        };
      }

      return api as API<E>;
    },

    flush: ({ api }) => getData(api.timeline),
  };

  return plugin;
};
