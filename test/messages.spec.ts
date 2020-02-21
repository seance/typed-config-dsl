import * as c from '../src/index';
import { readConfigValidation } from '../src/validation';
import {
  getValidConfigMessage,
  getInvalidConfigMessage,
  isValidConfig,
} from '../src/utils';
import { setupEnv } from './setupEnv';

describe('Messages', () => {
  it('show valid configuration', () => {
    setupEnv({
      BAR: 'bar',
      BAZ: '42',
      ZUT: 'true',
      ARRAYS_FOO: 'foo,bar,zut',
      ARRAYS_BAR: '1,2,3',
      ARRAYS_BAZ: 'true,false',
      SENSITIVES_PASSWORD: 'secret',
    });
    const reader = {
      foo: c.constant('foo'),
      bar: c.string('BAR'),
      baz: c.number('BAZ'),
      zut: c.boolean('ZUT'),
      qux: c.string('QUX').optional(),
      arrays: {
        foo: c.array('ARRAYS_FOO').string(),
        bar: c.array('ARRAYS_BAR').number(),
        baz: c.array('ARRAYS_BAZ').boolean(),
      },
      sensitives: {
        password: c.string('SENSITIVES_PASSWORD').sensitive(),
      },
    };
    const validation = readConfigValidation(reader);
    expect(isValidConfig(validation)).toBe(true);

    if (isValidConfig(validation)) {
      const message = getValidConfigMessage(validation);
      expect(message).toBe([
        'Configuration read:',
        ' - (constant)          string    foo        ',
        ' - BAR                 string    bar        ',
        ' - BAZ                 number    42         ',
        ' - ZUT                 boolean   true       ',
        ' - QUX                 string    (undefined)',
        ' - ARRAYS_FOO          string[]  foo,bar,zut',
        ' - ARRAYS_BAR          number[]  1,2,3      ',
        ' - ARRAYS_BAZ          boolean[] true,false ',
        ' - SENSITIVES_PASSWORD string    (sensitive)',
      ].join('\n'));
    }
  });

  it('show invalid configuration', () => {
    setupEnv({
      BAZ: 'baz',
      ZUT: 'yes',
      ARRAYS_BAR: '1,two,3',
      ARRAYS_BAZ: 'truey,falsey',
      SENSITIVES_NUMBER: 'secret but not a number',
    });
    const reader = {
      foo: c.constant('foo'),
      bar: c.string('BAR'),
      baz: c.number('BAZ'),
      zut: c.boolean('ZUT'),
      qux: c.string('QUX').optional(),
      arrays: {
        foo: c.array('ARRAYS_FOO').string(),
        bar: c.array('ARRAYS_BAR').number(),
        baz: c.array('ARRAYS_BAZ').boolean(),
      },
      sensitives: {
        password: c.string('SENSITIVES_PASSWORD').sensitive(),
      },
    };
    const validation = readConfigValidation(reader);
    expect(isValidConfig(validation)).toBe(false);

    if (!isValidConfig(validation)) {
      const message = getInvalidConfigMessage(validation);
      expect(message).toBe([
        'Invalid configuration:',
        'Missing values for following configuration keys:',
        ' - BAR                 string  ',
        ' - ARRAYS_FOO          string[]',
        ' - SENSITIVES_PASSWORD string  ',
        'Malformed values for following configuration keys:',
        ' - BAZ        number    baz          Cannot parse as float                        ',
        ' - ZUT        boolean   yes          Expected `true` or `false`                   ',
        ' - ARRAYS_BAR number[]  1,two,3      Cannot parse each element as float           ',
        ' - ARRAYS_BAZ boolean[] truey,falsey Expected each element to be `true` or `false`',
      ].join('\n'));
    }
  });
});
