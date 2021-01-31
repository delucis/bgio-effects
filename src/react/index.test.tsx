import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import type { Game, Ctx } from 'boardgame.io';
import { Client, BoardProps } from 'boardgame.io/react';
import {
  EffectsBoardWrapper,
  useEffectListener,
  useEffectQueue,
  useEffectState,
  useLatestPropsOnEffect,
} from '.';
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
  useEffectListener<typeof config, G>(
    '*',
    (type, payload, _props) => {
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

describe('useEffectListener', () => {
  test('callback can return a clean-up callback', async () => {
    enum ListenerState {
      'Initial' = 'bar',
      'OnEffect' = 'foo',
      'AfterEffect' = 'baz',
    }
    const clear = jest.fn((to: NodeJS.Timeout) => clearTimeout(to));
    const ComponentWithEffects = () => {
      const [state, setState] = useState(ListenerState.Initial);
      useEffectListener<typeof config>(
        'shortEffect',
        () => {
          setState(ListenerState.OnEffect);
          const to = setTimeout(() => {
            setState(ListenerState.AfterEffect);
          }, 150);
          return () => clear(to);
        },
        []
      );
      return <p data-testid="CWE">{state}</p>;
    };
    const App = Client<G>({
      game: (game as unknown) as Game<G>,
      debug: false,
      board: EffectsBoardWrapper(({ G, moves }: BoardProps<G>) => (
        <main>
          {(!G.val || G.val === GVal.repeatEffects) && <ComponentWithEffects />}
          <p data-testid="G-val">{G.val}</p>
          <button onClick={() => moves.simple()}>Simple Move</button>
          <button onClick={() => moves.repeatEffects()}>Repeat Effects</button>
        </main>
      )),
    });

    render(<App />);
    expect(screen.getByTestId('CWE')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Repeat Effects'));
    await waitFor(() => screen.getByText(GVal.repeatEffects));
    await waitFor(() => screen.getByText(ListenerState.OnEffect));
    expect(clear).toHaveBeenCalledTimes(0);
    await waitFor(() => screen.getByText(ListenerState.AfterEffect));
    // Called once when cleanup executed for repeated effect.
    expect(clear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Simple Move'));
    await waitFor(() => screen.getByText(GVal.simple));
    expect(screen.queryByTestId('CWE')).not.toBeInTheDocument();
    // Called again on component unmount.
    expect(clear).toHaveBeenCalledTimes(2);
  });

  test('callback receives new board props', async () => {
    const ComponentWithEffects = () => {
      const [state, setState] = useState<G['val']>();
      useEffectListener<typeof config, G>(
        'longEffect',
        (_payload: string, { G }: BoardProps<G>) => {
          setState(G.val);
        },
        []
      );
      return <p data-testid="CWE">{state}</p>;
    };
    const App = Client<G>({
      game: (game as unknown) as Game<G>,
      debug: false,
      board: EffectsBoardWrapper(
        ({ G, moves }: BoardProps<G>) => (
          <main>
            <ComponentWithEffects />
            <p data-testid="G-val">{G.val}</p>
            <button onClick={() => moves.wEffects()}>Move With Effects</button>
          </main>
        ),
        { updateStateAfterEffects: true }
      ),
    });

    render(<App />);
    expect(screen.getByTestId('CWE')).toBeInTheDocument();

    // Component with effects updates from G before the global state updates.
    fireEvent.click(screen.getByText('Move With Effects'));
    await waitFor(() =>
      expect(screen.getByTestId('CWE')).toHaveTextContent(GVal.wEffects)
    );
    expect(screen.getByTestId('G-val')).toBeEmptyDOMElement();
    await waitFor(() =>
      expect(screen.getByTestId('G-val')).toHaveTextContent(GVal.wEffects)
    );
  });

  test('can receive an onEnd callback', async () => {
    enum ListenerState {
      'Initial' = 'Initial',
      'OnStart' = 'OnStart',
      'OnEnd' = 'OnEnd',
    }
    const mock = jest.fn();
    const App = Client({
      game: (game as unknown) as Game<G>,
      debug: false,
      board: EffectsBoardWrapper(({ moves }) => {
        const [val, setVal] = useState(ListenerState.Initial);
        useEffectListener<typeof config>(
          'shortEffect',
          (val: string) => {
            mock(val, ListenerState.OnStart);
            setVal(ListenerState.OnStart);
          },
          [],
          (val: string) => {
            mock(val, ListenerState.OnEnd);
            setVal(ListenerState.OnEnd);
          },
          []
        );
        return (
          <div>
            <h1>{val}</h1>
            <button onClick={() => moves.wEffects()}>Move</button>
          </div>
        );
      }),
    });

    render(<App />);
    screen.getByText(ListenerState.Initial);

    fireEvent.click(screen.getByText('Move'));
    await waitFor(() => screen.getByText(ListenerState.OnStart));
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenLastCalledWith('2', ListenerState.OnStart);
    await waitFor(() => screen.getByText(ListenerState.OnEnd));
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock).toHaveBeenLastCalledWith('2', ListenerState.OnEnd);
  });

  test('throws if used outside of EffectsBoardWrapper', () => {
    const App = () => {
      useEffectListener('*', () => {}, []);
      return <div />;
    };
    expect(() => render(<App />)).toThrow(
      'useEffectListener must be called inside the effects context provider.'
    );
  });

  test('throws if not passed a dependency list', () => {
    const board = EffectsBoardWrapper(() => {
      useEffectListener(
        '*',
        () => {},
        (undefined as unknown) as React.DependencyList
      );
      return <div />;
    });
    const App = Client({ game: (game as unknown) as Game<G>, board });
    expect(() => render(<App />)).toThrow(
      'useEffectListener must receive a dependency list as its third argument.'
    );
  });

  test('throws if not passed an onEnd dependency list', () => {
    const board = EffectsBoardWrapper(() => {
      useEffectListener(
        '*',
        () => {},
        [],
        () => {},
        (undefined as unknown) as React.DependencyList
      );
      return <div />;
    });
    const App = Client({ game: (game as unknown) as Game<G>, board });
    expect(() => render(<App />)).toThrow(
      'useEffectListener must receive a dependency list as its fifth argument when using an onEffectEnd callback.'
    );
  });
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

describe('useEffectState', () => {
  test('throws if used outside of EffectsBoardWrapper', () => {
    const App = () => {
      const [] = useEffectState('*');
      return <div />;
    };
    expect(() => render(<App />)).toThrow(
      'useEffectListener must be called inside the effects context provider.'
    );
  });

  test('provides effect state', async () => {
    const board = EffectsBoardWrapper(({ moves }: BoardProps<G>) => {
      const [state, isActive] = useEffectState('longEffect', undefined, config);
      return (
        <main>
          <button onClick={() => moves.wEffects()}>Move With Effects</button>
          <p data-testid="state">{state}</p>
          <p data-testid="isActive">{JSON.stringify(isActive)}</p>
        </main>
      );
    });
    const App = Client({
      game: (game as unknown) as Game<G>,
      board,
      debug: false,
    });

    render(<App />);

    expect(screen.getByTestId('state')).toBeEmptyDOMElement();
    expect(screen.getByTestId('isActive')).toHaveTextContent('false');

    fireEvent.click(screen.getByText('Move With Effects'));
    const t1 = performance.now();
    await waitFor(() => screen.getByText('1'));
    expect(screen.getByTestId('isActive')).toHaveTextContent('true');

    await waitFor(() => screen.getByText('false'));
    const t = performance.now() - t1;
    expect(t).toBeGreaterThan(800);
  });

  test('can be set to an initial value', async () => {
    const App = Client({
      game: {},
      debug: false,
      board: EffectsBoardWrapper(() => {
        const [state] = useEffectState('longEffect', 'init', config);
        return <p data-testid="state">{state}</p>;
      }),
    });

    render(<App />);

    expect(screen.getByTestId('state')).toHaveTextContent('init');
  });
});

describe('useLatestPropsOnEffect', () => {
  test('throws if used outside of EffectsBoardWrapper', () => {
    const App = () => {
      const {} = useLatestPropsOnEffect('*');
      return <div />;
    };
    expect(() => render(<App />)).toThrow(
      'useBoardProps must be called inside the effects context provider.'
    );
  });

  test('provides effect state', async () => {
    const board = EffectsBoardWrapper(
      ({ moves }: BoardProps<G>) => {
        const { G } = useLatestPropsOnEffect('longEffect');
        const [, isActive] = useEffectState('longEffect', undefined, config);
        return (
          <main>
            <button onClick={() => moves.wEffects()}>Move With Effects</button>
            <p data-testid="state">{G.val}</p>
            <p data-testid="isActive">{JSON.stringify(isActive)}</p>
          </main>
        );
      },
      { updateStateAfterEffects: true }
    );

    const App = Client({
      game: (game as unknown) as Game<G>,
      board,
      debug: false,
    });

    render(<App />);

    expect(screen.getByTestId('state')).toBeEmptyDOMElement();

    fireEvent.click(screen.getByText('Move With Effects'));
    await waitFor(() => screen.getByText('true'));

    expect(screen.getByTestId('state')).toHaveTextContent(GVal.wEffects);
  });
});
