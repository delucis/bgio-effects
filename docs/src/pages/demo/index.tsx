import React from 'react';
import { Client, BoardProps } from 'boardgame.io/react';
import game from './Game';
import {
  EffectsBoardWrapper,
  useEffectState,
  useEffectQueue,
} from 'bgio-effects/react';
import './style.css';
import { SrcLink } from '../../components/SrcLink';

function Flash({ type }: { type: 'A' | 'B' }) {
  const [state, flash] = useEffectState(type, '');

  const flashClassList = ['flash'];
  if (flash) flashClassList.push('flash--active');
  const flashClasses = flashClassList.join(' ');

  return (
    <div className={flashClasses}>
      <div>{type}</div>
      <p>payload</p>
      <code>{flash && state}</code>
    </div>
  );
}

function BoardComponent({ moves }: BoardProps) {
  const { size } = useEffectQueue();

  return (
    <div className="demo">
      <Flash type={'A'} />
      <Flash type={'B'} />
      <div>
        <p>
          Queue size: <strong>{size}</strong>
        </p>
        <button onClick={() => moves.One()} className="btn">
          Make Move One
        </button>
        <button onClick={() => moves.Two()} className="btn">
          Make Move Two
        </button>
      </div>
      <SrcLink snippet="demo/index.tsx" />
    </div>
  );
}

const board = EffectsBoardWrapper(BoardComponent, {
  speed: 0.5,
  updateStateAfterEffects: true,
});

export default Client({ game, board, debug: false });
