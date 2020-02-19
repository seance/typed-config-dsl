import * as c from '../src/index';

describe('config-dsl', () => {
  it('works', () => {
    process.env.FOO = '42';
    process.env.BAR = '13';
    const config = c.readConfig({
      foo: c.number('FOO'),
      bar: c.number('BAR'),
    });
    expect(config).toStrictEqual({ foo: 42, bar: 13 });
  });

  it('works2', () => {
    delete process.env.FOO;
    const reader = {
      foo: c.number('FOO'),
    };
    expect(() => c.readConfig(reader)).toThrow();
  });
});
