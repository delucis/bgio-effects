import React, { useEffect } from 'react';
import { Client, BoardProps } from 'boardgame.io/react';
import { useDie } from './components/Die';
import { BaseGame } from './Game';
import { SrcLink } from '../../components/SrcLink';
import { Scoreboard } from './components/Scoreboard';
import './board.css';

function Board({ G, ctx, moves, reset }: BoardProps) {
  const [Die, rollTo] = useDie(G.roll);

  useEffect(() => rollTo(G.roll), [G.roll, rollTo]);

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

      <SrcLink snippet="tutorial/snippet-1.tsx" />
    </div>
  );
}

export default Client({ game: BaseGame, board: Board, debug: false });
