import * as c from '../src/index';
import { setupEnv } from './setupEnv';

const silent: c.Options = { silent: true };

describe('readConfig', () => {
  it('reads primitive and array values', () => {
    setupEnv({
      FOO: 'foo',
      BAR: '42',
      ZUT: 'true',
      QUUX: '1,2,3',
    });
    expect(c.readConfig(c.string('FOO'), silent)).toBe('foo');
    expect(c.readConfig(c.number('BAR'), silent)).toBe(42);
    expect(c.readConfig(c.boolean('ZUT'), silent)).toBe(true);
    expect(c.readConfig(c.array('QUUX').number(), silent)).toStrictEqual([1, 2, 3]);
  });

  it('reads recursive object shapes with reader leaves', () => {
    setupEnv({
      FOO: 'foo',
      BAR: '42',
      ZUT: 'true',
      QUUX: '1,2,3',
    });

    interface Config {
      foo: string;
      topLevelShape: {
        bar: number;
        recursiveShape: {
          zut: boolean;
          quux: number[];
        };
      };
    }

    expect(c.readConfig<Config>({
      foo: c.string('FOO'),
      topLevelShape: {
        bar: c.number('BAR'),
        recursiveShape: {
          zut: c.boolean('ZUT'),
          quux: c.array('QUUX').number(),
        },
      },
    }, silent)).toStrictEqual({
      foo: 'foo',
      topLevelShape: {
        bar: 42,
        recursiveShape: {
          zut: true,
          quux: [1, 2, 3],
        },
      },
    });
  });

  it('types and reads optional and default values correctly', () => {
    setupEnv({
      FOO: 'foo',
      BAR: '42',
      ZUT: 'true',
      QUUX: '1,2,3',
    });

    interface Config {
      foo: string | undefined;
      bar: number;
      baz: number | undefined;
      zux: boolean;
      quux: number[] | undefined,
    }

    expect(c.readConfig<Config>({
      foo: c.string('FOO').optional(), // value optional, is present
      bar: c.number('BAR').default(100), // has default, is present
      baz: c.number('BAZ').optional(), // value optional, not present
      zux: c.boolean('ZUX').default(true), // has default, not present
      quux: c.array('QUUX').number(), // type optional, reader required
    }, silent)).toStrictEqual({
      foo: 'foo',
      bar: 42,
      baz: undefined,
      zux: true,
      quux: [1, 2, 3],
    });
  });

  it('throws error when config is invalid', () => {
    setupEnv({
      BAR: 'bar',
    });
    expect(() => c.readConfig(c.string('FOO'))).toThrow();
    expect(() => c.readConfig(c.number('BAR'))).toThrow();
  });
});
