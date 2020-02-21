import {
  ConfigReader,
  ConfigReaderDsl,
  SensitiveDsl,
  ArrayConfigReaderBuilder,
} from './types';
import { constantReader, requiredReader } from './readers';
import { valid, malformedValue } from './utils';

const numRegex = /^-?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?$/;

export const constant = <A>(value: A): ConfigReader<A> & SensitiveDsl<A> =>
  constantReader(value);

export const string = (key: string): ConfigReaderDsl<string> =>
  requiredReader<string>(
    key,
    'string',
    (value) => value,
    (value, type, sensitive) => valid(value, key, type, sensitive),
  );

export const number = (key: string): ConfigReaderDsl<number> =>
  requiredReader<number>(
    key,
    'number',
    (value) => parseFloat(value),
    (value, type, sensitive, raw) => {
      if (isNaN(value)) {
        return malformedValue(
          key,
          type,
          raw,
          sensitive,
          'Cannot parse as float',
        );
      }
      if (!raw.match(numRegex)) {
        return malformedValue(
          key,
          type,
          raw,
          sensitive,
          'Badly formatted number',
        );
      }
      return valid(value, key, type, sensitive);
    },
  );

export const boolean = (key: string): ConfigReaderDsl<boolean> =>
  requiredReader<boolean>(
    key,
    'boolean',
    (value) => value === 'true',
    (value, type, sensitive, raw) =>
      raw === 'true' || raw === 'false'
        ? valid(value, key, type, sensitive)
        : malformedValue(
            key,
            type,
            raw,
            sensitive,
            'Expected `true` or `false`',
          ),
  );

export const array = (
  key: string,
  separator: string = ',',
): ArrayConfigReaderBuilder => ({
  string() {
    return requiredReader(
      key,
      'string[]',
      (value) => value.split(separator),
      (value, type, sensitive) => valid(value, key, type, sensitive),
    );
  },

  number() {
    return requiredReader(
      key,
      'number[]',
      (value) => value.split(separator).map((s) => parseFloat(s)),
      (value, type, sensitive, raw) =>
        value.every((v) => !isNaN(v))
          ? valid(value, key, type, sensitive)
          : malformedValue(
              key,
              type,
              raw,
              sensitive,
              'Cannot parse each element as float',
            ),
    );
  },

  boolean() {
    return requiredReader(
      key,
      'boolean[]',
      (value) => value.split(separator).map((s) => s === 'true'),
      (value, type, sensitive, raw) =>
        raw.split(separator).every((s) => s === 'true' || s === 'false')
          ? valid(value, key, type, sensitive)
          : malformedValue(
              key,
              type,
              raw,
              sensitive,
              'Expected each element to be `true` or `false`',
            ),
    );
  },
});
