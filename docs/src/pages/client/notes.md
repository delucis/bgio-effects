---
title: Notes
description: General notes about bgio-effects client usage.
layout: layout:MainLayout
---

## Initial render

Effects are not emitted the first time the client gets state from boardgame.io.

You should think of effects as the “glue” between two states: the transition
from state 1 to state 2 produces effects. For this reason, effects are not
emitted during the initial render, where _only_ one state is present.

<!-- Use h3 tag to avoid inclusion in Table of Contents. -->
<h3>An example</h3>

A game board includes a die that is rolled on certain moves.
The state before and after rolling the die might look like:

1. Die shows 4 _(before move)_
2. Die shows 6 _(after move)_

To trigger the animation each time the die is rolled, we can add an effect to
the move so that between state 1 and state 2, a “roll die” effect fires and
animates the transition from showing 4 to showing 6.

Now let’s say a player closes their game and comes back later. Nothing more has
happened and state 2 is still the most recent:

2. Die shows 6

The die should show 6 just like after the move was first made, but it wouldn’t
make sense to also display the die rolling animation because we aren’t showing
a transition from state 1 to state 2 anymore.

## Timing precision

This library is not designed with highly precise timing and animation
synchronisation in mind. Effects are emitted from a `requestAnimationFrame`
callback and the general implementation aims to be as performant and simple as
possible. Exact timing will depend on the frame rate of a user’s browser and
the accuracy of `performance.now()` (which may be limited for security reasons).
