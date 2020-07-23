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
 * Generate a unique ID.
 * @return A random 8-character string.
 */
const uuid = () => nanoid(8);

/**
 * Generate the data template initialised for each game action.
 * @return - Object with a unique `id` & an empty `queue` array.
 */
const initialData = <E extends EffectsPluginConfig['effects']>(): Data<E> => ({
  id: uuid(),
  duration: 0,
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
      const timeline = new Timeline<E>();
      const api = {} as Record<string, (...args: any[]) => any>;

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
            timeline.add(effect, position, duration);
          };
        } else {
          api[type] = (
            position?: TimingParams[0],
            duration: TimingParams[1] | undefined = defaultDuration
          ) => {
            timeline.add({ type } as Effect<E>, position, duration);
          };
        }
      }

      return {
        ...api,
        timeline: {
          getQueue: () => timeline.getQueue(),
          clear: () => timeline.clear(),
          isEmpty: () => timeline.isEmpty,
          duration: () => timeline.duration,
        },
      } as API<E>;
    },

    flush: ({ api }) => ({
      id: uuid(),
      duration: api.timeline.duration(),
      queue: api.timeline.getQueue(),
    }),
  };

  return plugin;
};
