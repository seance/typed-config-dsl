import { Transform, Validator, Validation } from './types';
import { malformedValue } from './utils';

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
