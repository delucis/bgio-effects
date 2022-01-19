import React, { memo, useCallback, useState } from 'react';
import './Die.css';

type D6Spots = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Elements for the pips at each location on a die face.
 */
const pips = {
  topLeft: <circle r="7" cx="25" cy="25" />,
  topRight: <circle r="7" cx="75" cy="25" />,
  centre: <circle r="7" cx="50" cy="50" />,
  bottomLeft: <circle r="7" cx="25" cy="75" />,
  bottomRight: <circle r="7" cx="75" cy="75" />,
};

/**
 * Die face tuple for classic 6-sided dice with value displayed with pips.
 */
const PipFaces = [
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.centre}
  </svg>,
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.bottomLeft}
    {pips.topRight}
  </svg>,
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.bottomLeft}
    {pips.centre}
    {pips.topRight}
  </svg>,
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.topLeft}
    {pips.topRight}
    {pips.bottomLeft}
    {pips.bottomRight}
  </svg>,
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.topLeft}
    {pips.topRight}
    {pips.centre}
    {pips.bottomLeft}
    {pips.bottomRight}
  </svg>,
  <svg viewBox="0 0 100 100" className="jk-pip-face">
    {pips.topLeft}
    {pips.topRight}
    <circle r="7" cx="25" cy="50" />
    <circle r="7" cx="75" cy="50" />
    {pips.bottomLeft}
    {pips.bottomRight}
  </svg>,
] as const;

/**
 * Rotation needed to position each die face to form a cube.
 */
const FaceRotations = [
  'rotateY(-90deg)',
  'rotateX(-90deg)',
  'rotateY(90deg)',
  'rotateY(0deg)',
  'rotateX(90deg)',
  'rotateX(180deg)',
] as const;

/**
 * Die rotation needed to display each die face on top.
 */
const DieRotations = [
  'rotateX(20deg) rotateZ(45deg) rotateY(90deg)',
  'rotateX(110deg) rotateY(45deg)',
  'rotateX(20deg) rotateZ(45deg) rotateY(-90deg)',
  'rotateX(20deg) rotateZ(45deg)',
  'rotateX(-70deg) rotateY(-45deg)',
  'rotateX(-160deg) rotateZ(-45deg)',
] as const;

interface DieProps {
  dieSize?: string;
  face?: D6Spots;
  animated?: boolean;
}

/**
 * Render a six-sided die.
 */
const _Die = ({ dieSize = '2em', animated = false, face = 6 }: DieProps) => {
  const faces = PipFaces;
  const classList = ['jk-die'];
  if (animated) classList.push('jk-die--animated');
  const className = classList.join(' ');

  return (
    <div
      {...{ className }}
      style={{ '--jk-die-size': dieSize } as React.CSSProperties}
      aria-label={`Die showing ${face}`}
      role="img"
    >
      <div className="jk-shadow" aria-hidden={true} />
      <div
        className="jk-die-body"
        style={{ transform: DieRotations[face - 1] }}
        aria-hidden={true}
      >
        <div className="jk-internal" style={{ transform: 'rotateZ(0deg)' }} />
        <div className="jk-internal" style={{ transform: 'rotateX(90deg)' }} />
        <div className="jk-internal" style={{ transform: 'rotateY(90deg)' }} />
        {faces.map((face, i) => (
          <React.Fragment key={i}>
            <div
              className="jk-face"
              style={{
                transform: `${FaceRotations[i]} translateZ(calc(var(--jk-die-size) * .5))`,
              }}
            >
              {face}
            </div>
            <div
              className="jk-inner-face"
              style={{
                transform: `${FaceRotations[i]} translateZ(calc(var(--jk-die-size) * .49))`,
              }}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Die = memo(_Die);

/**
 * Use `useDie` to get a [`DieComponent`, `rollToFunction`] tuple.
 */
export const useDie = (initialValue: D6Spots = 1) => {
  const [props, setProps] = useState({ face: initialValue, animated: false });

  const rollTo = useCallback((face: D6Spots) => {
    setProps({ face, animated: true });
    const to = setTimeout(() => setProps({ face, animated: false }), 1000);
    return () => clearTimeout(to);
  }, []);

  const ControlledDie = useCallback(
    (dieProps: DieProps) => <Die {...{ ...dieProps, ...props }} />,
    [props]
  );

  return [ControlledDie, rollTo] as const;
};
