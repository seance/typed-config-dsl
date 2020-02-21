import {
  ConfigReader,
  Validation,
  ConfigValidation,
  ValidConfig,
  InvalidConfig,
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

const maxWidth = (max: number, str: string) => Math.max(max, str.length);

const padToWidth = (width: number) => (str: string) =>
  `${str}${' '.repeat(Math.max(0, width - str.length))}`;

const padColumnsToMaxWidth = (columns: string[][]): string[][] => {
  const maxWidths = columns.map((c) => c.reduce(maxWidth, 0));
  return maxWidths.map((maxWidth, i) => columns[i].map(padToWidth(maxWidth)));
};

export const getValidConfigMessage = <A>(config: ValidConfig<A>): string => {
  const columns = padColumnsToMaxWidth([
    config.valids.map((v) => ` - ${v.key}`),
    config.valids.map((v) => v.type),
    config.valids.map((v) =>
      v.sensitive
        ? '(sensitive)'
        : v.value !== undefined
        ? `${v.value}`
        : '(undefined)',
    ),
  ]);
  const rows = config.valids.map((_, i) => columns.map((c) => c[i]).join(' '));
  return ['Configuration read:', ...rows].join('\n');
};

export const getInvalidConfigMessage = (config: InvalidConfig): string => {
  const missingKeysColumns = padColumnsToMaxWidth([
    config.missingKeys.map((v) => ` - ${v.key}`),
    config.missingKeys.map((v) => v.type),
  ]);
  const malformedValuesColumns = padColumnsToMaxWidth([
    config.malformedValues.map((v) => ` - ${v.key}`),
    config.malformedValues.map((v) => v.type),
    config.malformedValues.map((v) =>
      v.sensitive ? '(sensitive)' : v.value ?? '(undefined)',
    ),
    config.malformedValues.map((v) => v.message ?? ''),
  ]);
  const missingKeysRows = config.missingKeys.map((_, i) =>
    missingKeysColumns.map((c) => c[i]).join(' '),
  );
  const malformedValuesRows = config.malformedValues.map((_, i) =>
    malformedValuesColumns.map((c) => c[i]).join(' '),
  );
  return `Invalid configuration:\n${[
    ...(missingKeysRows.length
      ? ['Missing values for following configuration keys:', ...missingKeysRows]
      : []),
    ...(malformedValuesRows.length
      ? [
          'Malformed values for following configuration keys:',
          ...malformedValuesRows,
        ]
      : []),
  ].join('\n')}`;
};

export const logValidConfig = <A>(
  config: ValidConfig<A>,
  logger: (message: string) => void,
): void => {
  logger(getValidConfigMessage(config));
};

export const throwConfigError = (config: InvalidConfig): never => {
  throw new Error(getInvalidConfigMessage(config));
};
