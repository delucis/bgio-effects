import React, { useEffect, useState } from 'react';
import './Scoreboard.css';

/** Hook that temporarily returns `true` each time the passed number increments. */
const useDidIncrement = (n: number) => {
  const [didIncrement, setDidIncrement] = useState(false);

  // Animate the score component each time it changes.
  useEffect(() => {
    // Don’t animate on initial render.
    if (n === 0) return;
    setDidIncrement(true);
    const timeout = setTimeout(() => {
      setDidIncrement(false);
    }, 1000);
    return () => timeout && clearTimeout(timeout);
  }, [n]);

  return didIncrement;
};

const Score = ({ score }: { score: number }) => {
  const didIncrement = useDidIncrement(score);

  return (
    <>
      <label>
        <span className={didIncrement ? 'tada' : undefined}>
          Sixes: <strong>{score}</strong>
        </span>
        <progress max={5} value={score}>
          {score}
        </progress>
      </label>
    </>
  );
};

export function Scoreboard({
  score,
  moves,
  isGameover,
}: {
  score: number;
  moves: number;
  isGameover: boolean;
}) {
  return (
    <div>
      <p>
        <span>
          Rolls: <strong>{moves}</strong>
        </span>
        <br />
        <Score score={score} />
      </p>
      <p>{isGameover && <strong>You win!</strong>}</p>
    </div>
  );
}
