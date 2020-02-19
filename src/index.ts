import { ConfigReader, ShapeReader, Reader, ConfigValidation } from './types';
import {
  isConfigReader,
  foldValidation,
  validConfig,
  invalidConfig,
  mapConfigValidation,
  mergeConfigValidation,
  isValidConfig,
  printValidConfig,
  throwConfigError,
} from './utils';

export { ConfigReader } from './types';
export * from './dsl';

const readShapeValidation = <A extends {}>(
  shape: ShapeReader<A>,
): ConfigValidation<A> =>
  Object.entries(shape).reduce((validationForA, [k, r]) => {
    const mapToKey = mapConfigValidation((v) => ({ [k]: v } as Partial<A>));
    const validationForK = readConfigValidation(r as Reader<A[keyof A]>);
    return mergeConfigValidation(validationForA, mapToKey(validationForK));
  }, validConfig<Partial<A>>({})) as ConfigValidation<A>;

const readReaderValidation = <A>(
  reader: ConfigReader<A>,
): ConfigValidation<A> => {
  return foldValidation<A, ConfigValidation<A>>(
    (valid) => validConfig(valid.value, [valid]),
    (missingKey) => invalidConfig<A>([], [missingKey]),
    (malformedValue) => invalidConfig<A>([], [], [malformedValue]),
  )(reader.read());
};

const readConfigValidation = <A>(r: Reader<A>): ConfigValidation<A> =>
  isConfigReader(r) ? readReaderValidation(r) : readShapeValidation(r);

export const readConfig = <A>(r: Reader<A>): A => {
  const validation = readConfigValidation(r);
  if (!isValidConfig(validation)) {
    return throwConfigError(validation);
  }
  printValidConfig(validation);
  return validation.value;
};
