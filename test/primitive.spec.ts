import * as c from '../src/index';
import { transformAndValidate } from '../src/validation';
import { valid } from '../src/utils';
import { setupEnv } from './setupEnv';

describe('Primitive config reader', () => {
  it('constant reads constant values', () => {
    expect(c.constant('foo').read()).toStrictEqual({
      result: 'success',
      key: '(constant)',
      type: typeof 'foo',
      value: 'foo',
      sensitive: false,
    });
    expect(c.constant(42).read()).toStrictEqual({
      result: 'success',
      key: '(constant)',
      type: typeof 42,
      value: 42,
      sensitive: false,
    });
    expect(c.constant(true).read()).toStrictEqual({
      result: 'success',
      key: '(constant)',
      type: typeof true,
      value: true,
      sensitive: false,
    });
    expect(c.constant('secret').sensitive().read()).toStrictEqual({
      result: 'success',
      key: '(constant)',
      type: typeof 'secret',
      value: 'secret',
      sensitive: true,
    });
  });

  it('string reads string values', () => {
    setupEnv({
      FOO: 'foo',
      BAR: 'bar',
    });
    expect(c.string('FOO').read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'string',
      value: 'foo',
      sensitive: false,
    });
    expect(c.string('BAR').read()).toStrictEqual({
      result: 'success',
      key: 'BAR',
      type: 'string',
      value: 'bar',
      sensitive: false,
    });
    expect(c.string('ZUT').read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'string',
    });
    expect(c.string('QUX').optional().sensitive().read()).toStrictEqual({
      result: 'success',
      key: 'QUX',
      type: 'string',
      value: undefined,
      sensitive: true,
    });
    expect(c.string('XUZ').default('xuz').sensitive().read()).toStrictEqual({
      result: 'success',
      key: 'XUZ',
      type: 'string',
      value: 'xuz',
      sensitive: true,
    });
  });

  it('number reads number values', () => {
    setupEnv({
      FOO: '42',
      BAR: 'bar',
      BAZ: '42 hello there 3',
    });
    expect(c.number('FOO').read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'number',
      value: 42,
      sensitive: false,
    });
    expect(c.number('BAR').read()).toStrictEqual({
      result: 'malformedValue',
      key: 'BAR',
      type: 'number',
      value: 'bar',
      sensitive: false,
      message: 'Cannot parse as float',
    });
    expect(c.number('BAZ').read()).toStrictEqual({
      result: 'malformedValue',
      key: 'BAZ',
      type: 'number',
      value: '42 hello there 3',
      sensitive: false,
      message: 'Badly formatted number',
    });
    expect(c.number('ZUT').read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'number',
    });
  });

  it('boolean reads boolean values', () => {
    setupEnv({
      FOO: 'false',
      BAR: 'yes',
    });
    expect(c.boolean('FOO').read()).toStrictEqual({
      result: 'success',
      key: 'FOO',
      type: 'boolean',
      value: false,
      sensitive: false,
    });
    expect(c.boolean('BAR').read()).toStrictEqual({
      result: 'malformedValue',
      key: 'BAR',
      type: 'boolean',
      value: 'yes',
      sensitive: false,
      message: 'Expected `true` or `false`',
    });
    expect(c.boolean('ZUT').read()).toStrictEqual({
      result: 'missingKey',
      key: 'ZUT',
      type: 'boolean',
    });
  });

  it('xxx', () => {
    const reader: c.ConfigReader<string> = {
      read() {
        return transformAndValidate(
          '(custom)',
          'string',
          'foo',
          () => { throw new Error('BOOM!'); },
          (value, type, sensitive) => valid(value, '(custom)', type, sensitive),
          false,
        );
      }
    };
    expect(reader.read()).toStrictEqual({
      result: 'malformedValue',
      key: '(custom)',
      type: 'string',
      value: 'foo',
      sensitive: false,
      message: 'BOOM!',
    });
  });
});
