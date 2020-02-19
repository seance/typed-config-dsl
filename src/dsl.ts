import { ConfigReaderDsl } from './types';
import { requiredReader } from './readers';
import { valid, malformedValue } from './utils';

export const number = (key: string): ConfigReaderDsl<number> =>
  requiredReader<number>(
    key,
    'number',
    (value) => parseFloat(value),
    (value, type, sensitive, raw) =>
      !isNaN(value)
        ? valid(value, key, type, sensitive)
        : malformedValue(key, type, raw, sensitive, 'Cannot parse as float'),
  );
