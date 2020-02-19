import {
  ConfigReader,
  Validation,
  ConfigValidation,
  ValidConfig,
  Valid,
  MissingKey,
  MalformedValue,
} from './types';

export const isConfigReader = <A>(x: any): x is ConfigReader<A> =>
  'read' in x && x.read instanceof Function;

export const valid = <A>(
  value: A,
  key: string,
  type: string,
  sensitive: boolean,
): Validation<A> => ({
  result: 'success',
  key,
  type,
  value,
  sensitive,
});

export const missingKey = <A>(key: string, type: string): Validation<A> => ({
  result: 'missingKey',
  key,
  type,
});

export const malformedValue = <A>(
  key: string,
  type: string,
  value: string,
  sensitive: boolean,
  message?: string,
): Validation<A> => ({
  result: 'malformedValue',
  key,
  type,
  value,
  sensitive,
  message,
});

export const foldValidation = <A, B>(
  onValid: (v: Valid<A>) => B,
  onMissingKey: (v: MissingKey) => B,
  onMalformedValue: (v: MalformedValue) => B,
) => (validation: Validation<A>) => {
  switch (validation.result) {
    case 'success':
      return onValid(validation);
    case 'missingKey':
      return onMissingKey(validation);
    case 'malformedValue':
      return onMalformedValue(validation);
  }
};

export const validConfig = <A>(
  value: A | undefined,
  valids: Valid<unknown>[] = [],
  missingKeys: MissingKey[] = [],
  malformedValues: MalformedValue[] = [],
): ConfigValidation<A> => ({
  value,
  valids,
  missingKeys,
  malformedValues,
});

export const invalidConfig = <A>(
  valids: Valid<unknown>[] = [],
  missingKeys: MissingKey[] = [],
  malformedValues: MalformedValue[] = [],
): ConfigValidation<A> => ({
  valids,
  missingKeys,
  malformedValues,
});

export const isValidConfig = <A>(v: ConfigValidation<A>): v is ValidConfig<A> =>
  v.missingKeys.length === 0 && v.malformedValues.length === 0;

export const mergeConfigValidation = <A extends {}>(
  a: ConfigValidation<A>,
  b: ConfigValidation<A>,
): ConfigValidation<A> =>
  !isValidConfig(a) || !isValidConfig(b)
    ? invalidConfig<A>(
        [...a.valids, ...b.valids],
        [...a.missingKeys, ...b.missingKeys],
        [...a.malformedValues, ...b.malformedValues],
      )
    : validConfig<A>(
        { ...a.value, ...b.value },
        [...a.valids, ...b.valids],
        [...a.missingKeys, ...b.missingKeys],
        [...a.malformedValues, ...b.malformedValues],
      );

export const mapConfigValidation = <A, B>(f: (value: A) => B) => (
  validation: ConfigValidation<A>,
) => {
  if (isValidConfig(validation)) {
    return validConfig(
      f(validation.value),
      validation.valids,
      validation.missingKeys,
      validation.malformedValues,
    );
  }
  return (validation as unknown) as ConfigValidation<B>;
};

export const printValidConfig = <A>(config: ConfigValidation<A>): void => {
  console.log(
    [
      'Configuration read from environment:',
      ...config.valids.map((v) =>
        [
          ' - ',
          v.key,
          `(${v.type})`,
          v.sensitive ? '(sensitive)' : v.value ?? '(undefined)',
        ].join(' '),
      ),
    ].join('\n'),
  );
};

export const throwConfigError = <A>(config: ConfigValidation<A>): never => {
  throw new Error(
    `Invalid configuration:\n${[
      ...(config.missingKeys.length
        ? [
            'Missing following configuration keys:',
            ...config.missingKeys.map((v) =>
              [' - ', v.key, `(${v.type})`].join(' '),
            ),
          ]
        : []),
      ...(config.malformedValues.length
        ? [
            'Malformed values for following configuration keys:',
            ...config.malformedValues.map((v) =>
              [
                ' - ',
                v.key,
                `(${v.type})`,
                v.sensitive ? '(sensitive)' : v.value ?? '(undefined)',
                v.message,
              ].join(' '),
            ),
          ]
        : []),
    ].join('\n')}`,
  );
};
