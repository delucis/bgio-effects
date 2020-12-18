import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import type { Game, Ctx } from 'boardgame.io';
import { Client, BoardProps } from 'boardgame.io/react';
import { EffectsBoardWrapper, useEffectListener, useEffectQueue } from '.';
import { EffectsPlugin } from '../plugin';
import { EffectsCtxMixin } from '..';

console.error = jest.fn();

const config = {
  effects: {
    longEffect: {
      duration: 0.8,
      create: (str: string) => str,
    },
    shortEffect: {
      duration: 0.1,
      create: (str: string) => str,
    },
  },
} as const;

enum GVal {
  'simple' = 'simple',
  'wEffects' = 'wEffects',
  'repeatEffects' = 'repeatEffects',
}

type G = { val?: GVal };

const game: Game<G, Ctx & EffectsCtxMixin<typeof config>> = {
  plugins: [EffectsPlugin(config)],
  moves: {
    simple(G) {
      G.val = GVal.simple;
    },
    wEffects(G, ctx) {
      G.val = GVal.wEffects;
      ctx.effects.longEffect('1');
      ctx.effects.shortEffect('2');
    },
    repeatEffects(G, ctx) {
      G.val = GVal.repeatEffects;
      ctx.effects.shortEffect('2');
      ctx.effects.shortEffect('2');
    },
  },
};

const Board = ({ G, plugins, moves }: BoardProps<G>) => {
  const [lastEffect, setLastEffect] = useState<string>();
  useEffectListener<typeof config>(
    '*',
    (type, payload) => {
      setLastEffect(`${type}:${payload}`);
    },
    []
  );
  const { clear, flush, size } = useEffectQueue();

  return (
    <main>
      <h1>Effects Demo</h1>
      <p>
        Queue Size: <span data-testid="queue-size">{size}</span>
      </p>
      <p data-testid="last-effect">{lastEffect}</p>
      <p data-testid="G-val">{G.val}</p>
      <p data-testid="effects-id">{plugins.effects.data.id}</p>
      <button onClick={() => moves.simple()}>Simple Move</button>
      <button onClick={() => moves.wEffects()}>Move With Effects</button>
      <button onClick={clear}>Clear</button>
      <button onClick={flush}>Flush</button>
    </main>
  );
};

const appFactory = (opts?: Parameters<typeof EffectsBoardWrapper>[1]) =>
  Client<G>({
    game: (game as unknown) as Game,
    debug: false,
    board: EffectsBoardWrapper(Board, opts),
  });
const DefaultApp = appFactory();

test('App with effects renders without crashing', () => {
  render(<DefaultApp />);
  expect(screen.getByRole('main')).toHaveTextContent('Effects Demo');
});

test('Board component receives boardgame.io props', () => {
  render(<DefaultApp />);
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();
  expect(screen.getByTestId('effects-id')).toHaveTextContent(/^.{8}$/);
  fireEvent.click(screen.getByText('Simple Move'));
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.simple);
});

test('Effects are emitted one by one', async () => {
  render(<DefaultApp />);
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();

  // Make move that calls effects API
  fireEvent.click(screen.getByText('Move With Effects'));
  const t1 = performance.now();
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^4$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);

  // Wait for first effect to be emitted
  await waitFor(() => screen.getByText('longEffect:1'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^2$/);
  expect(screen.getByTestId('last-effect')).toHaveTextContent('longEffect:1');
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);

  // Wait for second effect to be emitted
  await waitFor(() => screen.getByText('shortEffect:2'));
  expect(performance.now() - t1).toBeGreaterThan(800);
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^1$/);
  expect(screen.getByTestId('last-effect')).toHaveTextContent('shortEffect:2');
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);

  // Wait for queue to empty
  await waitFor(() =>
    expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/)
  );
  expect(performance.now() - t1).toBeGreaterThan(900);
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/);
});

test('boardgame.io state can be updated after effects', async () => {
  const App = appFactory({ updateStateAfterEffects: true });
  render(<App />);

  // Make move that calls effects API
  fireEvent.click(screen.getByText('Move With Effects'));
  const t1 = performance.now();
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^4$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();

  // Wait for first effect to be emitted
  await waitFor(() => screen.getByText('longEffect:1'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^2$/);
  expect(screen.getByTestId('last-effect')).toHaveTextContent('longEffect:1');
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();

  // Wait for second effect to be emitted
  await waitFor(() => screen.getByText('shortEffect:2'));
  expect(performance.now() - t1).toBeGreaterThan(800);
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^1$/);
  expect(screen.getByTestId('last-effect')).toHaveTextContent('shortEffect:2');
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();

  // Wait for boardgame.io state to update
  await waitFor(() => screen.getByText(GVal.wEffects));
  expect(performance.now() - t1).toBeGreaterThan(900);
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/);
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);
});

test('Effects queue can be cleared', async () => {
  render(<DefaultApp />);

  // Make move that calls effects API.
  fireEvent.click(screen.getByText('Move With Effects'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^4$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);

  // Clear effect queue.
  fireEvent.click(screen.getByText('Clear'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
});

test('Effects queue can be flushed', () => {
  render(<DefaultApp />);

  // Make move that calls effects API.
  fireEvent.click(screen.getByText('Move With Effects'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^4$/);
  expect(screen.getByTestId('last-effect')).toBeEmptyDOMElement();
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);

  // Flush effect queue.
  fireEvent.click(screen.getByText('Flush'));
  expect(screen.getByTestId('queue-size')).toHaveTextContent(/^0$/);
  expect(screen.getByTestId('last-effect')).toHaveTextContent(
    'effects:end:undefined'
  );
});

test('boardgame.io state updates after clearing effects queue', async () => {
  const App = appFactory({ updateStateAfterEffects: true });
  render(<App />);

  // Make move that calls effects API.
  fireEvent.click(screen.getByText('Move With Effects'));
  expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();

  await waitFor(() => screen.getByText('longEffect:1'));

  // Clear effect queue.
  fireEvent.click(screen.getByText('Clear'));
  expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects);
});

test('Speed option changes effect timing', async () => {
  const App = appFactory({ speed: 2, updateStateAfterEffects: true });
  render(<App />);

  // Make move that calls effects API
  fireEvent.click(screen.getByText('Move With Effects'));
  const t1 = performance.now();

  // Wait for first effect to be emitted
  await waitFor(() => screen.getByText('longEffect:1'));

  // Wait for second effect to be emitted
  await waitFor(() => screen.getByText('shortEffect:2'));
  let t = performance.now() - t1;
  expect(t).toBeGreaterThan(400);
  expect(t).toBeLessThan(430);

  // Wait for boardgame.io state to update
  await waitFor(() => screen.getByText(GVal.wEffects));
  t = performance.now() - t1;
  expect(t).toBeGreaterThan(450);
  expect(t).toBeLessThan(480);
});

test('useEffectListener callback can return a clean-up callback', async () => {
  enum ListenerState {
    'bar' = 'bar',
    'foo' = 'foo',
    'baz' = 'baz',
  }
  const clear = jest.fn((to: NodeJS.Timeout) => clearTimeout(to));
  const ComponentWithEffects = () => {
    const [state, setState] = useState(ListenerState.bar);
    useEffectListener<typeof config>(
      'shortEffect',
      () => {
        setState(ListenerState.foo);
        const to = setTimeout(() => {
          setState(ListenerState.baz);
        }, 100);
        return () => clear(to);
      },
      [state]
    );
    useEffectListener<typeof config>('shortEffect', () => {}, []);
    return <p data-testid="CWE">{state}</p>;
  };
  const App = Client<G>({
    game: (game as unknown) as Game<G>,
    debug: false,
    board: EffectsBoardWrapper(({ G, moves }: BoardProps<G>) => {
      return (
        <main>
          {(!G.val || G.val === GVal.repeatEffects) && <ComponentWithEffects />}
          <p data-testid="G-val">{G.val}</p>
          <button onClick={() => moves.simple()}>Simple Move</button>
          <button onClick={() => moves.repeatEffects()}>Repeat Effects</button>
        </main>
      );
    }),
  });

  render(<App />);
  expect(screen.getByTestId('CWE')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Repeat Effects'));
  await waitFor(() => screen.getByText(GVal.repeatEffects));
  await waitFor(() => screen.getByText(ListenerState.foo));
  await waitFor(() => screen.getByText(ListenerState.baz));
  fireEvent.click(screen.getByText('Simple Move'));
  await waitFor(() => screen.getByText(GVal.simple));
  expect(screen.queryByTestId('CWE')).not.toBeInTheDocument();
  expect(clear).toHaveBeenCalledTimes(3);
});

test('useEffectListener throws if used outside of EffectsBoardWrapper', () => {
  const App = () => {
    useEffectListener('*', () => {}, []);
    return <div />;
  };
  expect(() => render(<App />)).toThrow(
    'useEffectListener must be called inside the effects context provider.'
  );
});

test('useEffectQueue throws if used outside of EffectsBoardWrapper', () => {
  const App = () => {
    const queue = useEffectQueue();
    return <button onClick={queue.clear} />;
  };
  expect(() => render(<App />)).toThrow(
    'useEffectQueue must be called inside the effects context provider.'
  );
});
