import * as c from '../src/index';
import { setupEnv } from './setupEnv';

const silent: c.Options = { silent: true };

describe('Optional and default with environment', () => {
  it('handles optional in matched environment', () => {
    setupEnv({
      NODE_ENV: c.test,
    });
    expect(
      c.readConfig(c.string('FOO').optional(c.test), silent),
    ).toStrictEqual(undefined);
  });

  it('throws optional in unmatched environment', () => {
    setupEnv({
      NODE_ENV: c.production,
    });
    expect(() =>
      c.readConfig(c.string('FOO').optional(c.test), silent),
    ).toThrow();
  });

  it('handles default in matched environment', () => {
    setupEnv({
      NODE_ENV: c.development,
    });
    expect(
      c.readConfig(
        c.number('FOO').default(42, c.development, c.production),
        silent,
      ),
    ).toBe(42);
  });

  it('throws default in unmatched environment', () => {
    setupEnv({
      NODE_ENV: c.test,
    });
    expect(() =>
      c.readConfig(
        c.number('FOO').default(42, c.development, c.production),
        silent,
      ),
    ).toThrow();
  });
});
