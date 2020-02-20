import { Reader, Options } from './types';
import { readConfigValidation } from './validation';
import { isValidConfig, printValidConfig, throwConfigError } from './utils';

export { ConfigReader, ShapeReader, Reader, Options } from './types';
export * from './dsl';

const defaultOptions: Options = {
  silent: false,
};

export const production = 'production' as const;
export const test = 'test' as const;
export const development = 'development' as const;

export const readConfig = <A>(r: Reader<A>, options?: Partial<Options>): A => {
  const _options = { ...defaultOptions, ...(options ?? {}) };
  const validation = readConfigValidation(r);
  if (!isValidConfig(validation)) {
    return throwConfigError(validation);
  }
  if (!_options.silent) {
    printValidConfig(validation);
  }
  return validation.value;
};
