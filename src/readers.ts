import {
  ConfigReader,
  ConfigReaderDsl,
  SensitiveDsl,
  Transform,
  Validator,
  Environment,
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

const isEmptyOrIncludesCurrentEnv = (envs: Environment[]) => {
  const currentEnv = process.env.NODE_ENV;
  return envs.length === 0 || (currentEnv && envs.includes(currentEnv));
};

export const optionalReader = <A>(
  key: string,
  type: string,
  transform: Transform<A>,
  validator: Validator<A>,
  sensitive: boolean = false,
  optionalEnvs: Environment[] = [],
): ConfigReader<A | undefined> & SensitiveDsl<A | undefined> => ({
  read() {
    const raw = process.env[key];
    if (raw === undefined) {
      if (!isEmptyOrIncludesCurrentEnv(optionalEnvs)) {
        return missingKey(key, type);
      }
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
    return optionalReader(key, type, transform, validator, true, optionalEnvs);
  },
});

export const defaultReader = <A>(
  key: string,
  type: string,
  transform: Transform<A>,
  validator: Validator<A>,
  defaultValue: A,
  sensitive: boolean = false,
  defaultEnvs: Environment[] = [],
): ConfigReader<A> & SensitiveDsl<A> => ({
  read() {
    const raw = process.env[key];
    if (raw === undefined) {
      if (!isEmptyOrIncludesCurrentEnv(defaultEnvs)) {
        return missingKey(key, type);
      }
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
    return defaultReader(
      key,
      type,
      transform,
      validator,
      defaultValue,
      true,
      defaultEnvs,
    );
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
  optional(...optionalEnvs: Environment[]) {
    return optionalReader(
      key,
      type,
      transform,
      validator,
      sensitive,
      optionalEnvs,
    );
  },
  default(defaultValue: A, ...defaultEnvs: Environment[]) {
    return defaultReader(
      key,
      type,
      transform,
      validator,
      defaultValue,
      sensitive,
      defaultEnvs,
    );
  },
  sensitive() {
    return requiredReader(key, type, transform, validator, true);
  },
});
