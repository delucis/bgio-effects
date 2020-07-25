import { nanoid } from 'nanoid/non-secure';
import type { Plugin } from 'boardgame.io';
import { Timeline } from './timeline';
import type {
  API,
  Data,
  Effect,
  EffectsPluginConfig,
  TimingParams,
} from './types';

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
      const api = { timeline: new Timeline<E>() } as Record<string, any>;

      for (const type in config.effects) {
        if (type === 'timeline') {
          throw new RangeError(
            'Cannot create effect type “timeline”. Name is reserved.'
          );
        }

        const { create, duration: defaultDuration } = config.effects[type];

        if (create) {
          api[type] = (
            arg: Parameters<typeof create>[0],
            position?: TimingParams[0],
            duration: TimingParams[1] | undefined = defaultDuration
          ) => {
            const effect = { type, payload: create(arg) } as Effect<E>;
            api.timeline.add(effect, position, duration);
          };
        } else {
          api[type] = (
            position?: TimingParams[0],
            duration: TimingParams[1] | undefined = defaultDuration
          ) => {
            api.timeline.add({ type } as Effect<E>, position, duration);
          };
        }
      }

      return api as API<E>;
    },

    flush: ({ api }) => getData(api.timeline),
  };

  return plugin;
};
