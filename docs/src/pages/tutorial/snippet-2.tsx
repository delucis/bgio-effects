import React, { useEffect } from 'react';
import { Client, BoardProps } from 'boardgame.io/react';
import { useDie } from './components/Die';
import { GameWithRollEffect } from './Game';
import { SrcLink } from '../../components/SrcLink';
import { Scoreboard } from './components/Scoreboard';
import './board.css';
import { EffectsBoardWrapper, useEffectListener } from 'bgio-effects/react';

function Board({ G, ctx, moves, reset }: BoardProps) {
  const [Die, rollTo] = useDie(G.roll);

  useEffectListener('roll', (newValue) => rollTo(newValue), []);

  return (
    <div className="board">
      <div className="left-panel">
        <div className="left-panel-top">
          <Die dieSize="3rem" />
        </div>
        <button className="left-panel-bottom" onClick={() => moves.roll()}>
          Roll Die
        </button>
        {ctx.gameover && (
          <div className="gameover-splash">
            <button onClick={() => reset()}>Play Again</button>
          </div>
        )}
      </div>

      <Scoreboard
        score={G.score}
        moves={ctx.numMoves}
        isGameover={ctx.gameover}
      />

      <SrcLink snippet="tutorial/snippet-2.tsx" />
    </div>
  );
}

export default Client({
  game: GameWithRollEffect,
  board: EffectsBoardWrapper(Board),
  debug: false,
});
