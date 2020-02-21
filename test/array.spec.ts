import * as c from '../src/index';
import { setupEnv } from './setupEnv';

describe('Array config reader', () => {
  it('reads arrays of strings', () => {
    setupEnv({
      FOO: 'foo,bar,zut',
      BAR: '',
      BAZ: 'qux;plox',
    });
    expect(c.array('FOO').string().read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'string[]',
      value: ['foo', 'bar', 'zut'],
      sensitive: false,
    });
    expect(c.array('BAR').string().read()).toStrictEqual({
      result: 'success',
      key: 'BAR',
      type: 'string[]',
      value: [''],
      sensitive: false,
    });
    expect(c.array('BAZ', ';').string().read()).toStrictEqual({
      result: 'success',
      key: 'BAZ',
      type: 'string[]',
      value: ['qux', 'plox'],
      sensitive: false,
    });
    expect(c.array('ZUT').string().default([]).read()).toStrictEqual({
      result: 'success',
      key: 'ZUT',
      type: 'string[]',
      value: [],
      sensitive: false,
    });
    expect(c.array('ZUT').string().read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'string[]',
    });
  });

  it('reads arrays of numbers', () => {
    setupEnv({
      FOO: '1,42,1e20',
      BAR: '42,bar,1000',
    });
    expect(c.array('FOO').number().read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'number[]',
      value: [1, 42, 1e20],
      sensitive: false,
    });
    expect(c.array('BAR').number().read()).toStrictEqual({
      result: 'malformedValue',
      key: 'BAR',
      type: 'number[]',
      value: '42,bar,1000',
      sensitive: false,
      message: 'Cannot parse each element as float',
    });
    expect(c.array('ZUT').number().read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'number[]',
    });
  });

  it('reads arrays of booleans', () => {
    setupEnv({
      FOO: 'true,false,true',
      BAR: 'no,true',
    });
    expect(c.array('FOO').boolean().read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'boolean[]',
      value: [true, false, true],
      sensitive: false,
    });
    expect(c.array('BAR').boolean().read()).toStrictEqual({
      result: 'malformedValue',
      key: 'BAR',
      type: 'boolean[]',
      value: 'no,true',
      sensitive: false,
      message: 'Expected each element to be `true` or `false`',
    });
    expect(c.array('ZUT').boolean().read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'boolean[]',
    });
  });
});
