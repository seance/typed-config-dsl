import {
  ConfigReader,
  ConfigReaderDsl,
  SensitiveDsl,
  Transform,
  Validator,
} from './types';
import { transformAndValidate } from './validation';
import { valid, missingKey } from './utils';

export const constantReader = <A>(
  value: A,
  sensitive: boolean = false,
): ConfigReader<A> & SensitiveDsl<A> => ({
  read() {
    return valid(value, '(constant)', typeof value, sensitive);
  },
  sensitive() {
    return constantReader(value, true);
  },
});

export const optionalReader = <A>(
  key: string,
  type: string,
  transform: Transform<A>,
  validator: Validator<A>,
  sensitive: boolean = false,
): ConfigReader<A | undefined> & SensitiveDsl<A | undefined> => ({
  read() {
    const raw = process.env[key];
    if (raw === undefined) {
      return valid(undefined, key, type, sensitive);
    }
    return transformAndValidate(
      key,
      type,
      raw,
      transform,
      validator,
      sensitive,
    );
  },
  sensitive() {
    return optionalReader(key, type, transform, validator, true);
  },
});

export const defaultReader = <A>(
  key: string,
  type: string,
  transform: Transform<A>,
  validator: Validator<A>,
  defaultValue: A,
  sensitive: boolean = false,
): ConfigReader<A> & SensitiveDsl<A> => ({
  read() {
    const raw = process.env[key];
    if (raw === undefined) {
      return valid(defaultValue, key, type, sensitive);
    }
    return transformAndValidate(
      key,
      type,
      raw,
      transform,
      validator,
      sensitive,
    );
  },
  sensitive() {
    return defaultReader(key, type, transform, validator, defaultValue, true);
  },
});

export const requiredReader = <A>(
  key: string,
  type: string,
  transform: Transform<A>,
  validator: Validator<A>,
  sensitive: boolean = false,
): ConfigReaderDsl<A> => ({
  read() {
    const raw = process.env[key];
    if (raw === undefined) {
      return missingKey(key, type);
    }
    return transformAndValidate(
      key,
      type,
      raw,
      transform,
      validator,
      sensitive,
    );
  },
  optional() {
    return optionalReader(key, type, transform, validator, sensitive);
  },
  default(defaultValue: A) {
    return defaultReader(
      key,
      type,
      transform,
      validator,
      defaultValue,
      sensitive,
    );
  },
  sensitive() {
    return requiredReader(key, type, transform, validator, true);
  },
});
