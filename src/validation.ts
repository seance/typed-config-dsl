import { Transform, Validator, Validation } from './types';
import { ConfigReader, ShapeReader, Reader, ConfigValidation } from './types';
import {
  malformedValue,
  isConfigReader,
  foldValidation,
  validConfig,
  invalidConfig,
  mapConfigValidation,
  mergeConfigValidation,
} from './utils';

export const transformAndValidate = <A>(
  key: string,
  type: string,
  raw: string,
  transform: Transform<A>,
  validator: Validator<A>,
  sensitive: boolean,
): Validation<A> => {
  try {
    const value = transform(raw);
    return validator(value, type, sensitive, raw);
  } catch (err) {
    return malformedValue(key, type, raw, err.message);
  }
};

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

export const readConfigValidation = <A>(r: Reader<A>): ConfigValidation<A> =>
  isConfigReader(r) ? readReaderValidation(r) : readShapeValidation(r);
