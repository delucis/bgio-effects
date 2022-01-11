import type { Plugin } from 'boardgame.io';
import { Timeline } from './timeline';
import type { API, Data, EffectsPluginConfig, TimingParams } from './types';

const alphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
/** Simple 8-character UUID generator based on nanoid/non-secure. */
const uuid = () => {
  let id = '';
  let i = 8;
  while (i--) id += alphabet[(Math.random() * 64) | 0];
  return id;
};

/**
 * Generate the data POJO to persist from a Timeline instance.
 * @return - Object with a unique `id`, `duration` in seconds & `queue` array.
 */
const getData = (timeline: Timeline): Data => ({
  id: uuid(),
  duration: timeline.duration(),
  queue: timeline.getQueue(),
});

/**
 * More precise type for the plugin object, based on the boardgame.io plugin type.
 */
type EffectsPluginInterface<C extends EffectsPluginConfig> = Required<
  Pick<Plugin<API<C['effects']>, Data>, 'name' | 'setup' | 'api' | 'flush'>
>;

/**
 * Create a boardgame.io plugin that will provide an “effects” API.
 * @param config - Configuration object
 * @return - boardgame.io plugin object
 */
export const EffectsPlugin = <C extends EffectsPluginConfig>(
  config: C
): EffectsPluginInterface<C> => {
  type E = C['effects'];
  const plugin: EffectsPluginInterface<C> = {
    name: 'effects',

    setup: () => getData(new Timeline()),

    api: () => {
      const api = { timeline: new Timeline() } as {
        timeline: Timeline;
        [type: string]: any;
      };

      for (const type in config.effects) {
        if (type === 'timeline') {
          throw new RangeError(
            'Cannot create effect type “timeline”. Name is reserved.'
          );
        }

        const { create, duration: defaultDuration } = config.effects[type];

        api[type] = (...args: [any, ...TimingParams] | TimingParams) => {
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
