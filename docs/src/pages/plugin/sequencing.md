---
title: Sequencing effects
description: Details of the syntax used for effect sequencing in the bgio-effects game plugin.
layout: layout:MainLayout
---

You can add timing information to your effects to sequence them on the client.
By default, effects have a duration of `0` and are added to the end of the
timeline in the order they are called, which means they will all trigger
together as soon as the game state updates.

You can set an alternative default duration for each effect in its
config object:

```js
{
  effects: {
    longEffect: {
      duration: 5,
    },
  },
}
```

Now an effect called after `longEffect` will be added to the timeline
5 seconds after `longEffect` by default. For example:

```
0  .  .  .  .  5  .  .  .  .  10
↑              ↑
longEffect     nextEffect
```

You can also specify where an effect is placed on the timeline and override its
default duration when calling it, by passing position and duration parameters:

```js
effect(position, duration);
effectWithCreateFn(createArg, position, duration);
```

### `position`

  - **type:** `string` | `number`
  - **default:** `'>'` (end of the timeline)

  Specifies the placement of this effect on the timeline.

  A number places the effect at an absolute time, e.g. `3` would place the
  effect at 3 seconds along the timeline.

  A string is parsed according to a terse syntax for expressing different
  placements along the timeline:

  - `'>'`: Relative to the end of the timeline, for example:

    - `'>+1'`: 1 second after the end of the timeline

    - `'>-1'`: 1 second before the end of the timeline

  - `'<'`: Relative to the start of the last effect on the timeline,
    for example:

    - `'<'`: Aligned with the start of the last effect on the timeline

    - `'<+0.1'`: 0.1 seconds after the start of the last effect on the timeline

  - `'^'`: Insert at an absolute time and shift all subsequent effects in time,
    for example:

    - `'^3'`: Insert at 3 seconds and shift subsequent effects by this effect’s
      duration

    - `'^3->0.5'`: Insert at 3 seconds and shift subsequent effects by
      0.5 seconds

### `duration`

  - **type:** `number`
  - **default:** `0` or `duration` in the effect’s config if set

  A time in seconds to override the effect’s default duration.

## Example

The following effects create the following timeline.

```js
A(0, 4);     // add A at 0s, with a duration of 4s
B('>-1', 1); // add B 1s before the end of the timeline, i.e. at 3s
C('^2->1');  // add C at 2s, shift later effects by 1s
D('^0', 5);  // add D at 0s, shift later effects by its duration (5s)
E('<');      // add E, aligning it with start of last effect
```

```
0  .  .  .  .  5  .  ₇  .  ₉  10
↑              ↑     ↑     ↑
D              A     C    B+E
```
