export interface ConfigReader<A> {
  read: () => Validation<A>;
}

export interface ArrayConfigReaderBuilder {
  string: () => ConfigReaderDsl<string[]>;
  number: () => ConfigReaderDsl<number[]>;
  boolean: () => ConfigReaderDsl<boolean[]>;
}

export interface OptionalDsl<A> {
  optional: () => ConfigReader<A | undefined> & SensitiveDsl<A | undefined>;
  default: (defaultValue: A) => ConfigReader<A> & SensitiveDsl<A>;
}

export interface SensitiveDsl<A> {
  sensitive: () => ConfigReader<A>;
}

export type ConfigReaderDsl<A> = ConfigReader<A> &
  OptionalDsl<A> &
  SensitiveDsl<A>;

export type Transform<A> = (value: string) => A;

export type Validator<A> = (
  value: A,
  type: string,
  sensitive: boolean,
  raw: string,
) => Validation<A>;

export type Validation<A> = Valid<A> | MissingKey | MalformedValue;

export interface Valid<A> {
  result: 'success';
  key: string;
  type: string;
  value: A;
  sensitive: boolean;
}

export interface MissingKey {
  result: 'missingKey';
  key: string;
  type: string;
}

export interface MalformedValue {
  result: 'malformedValue';
  key: string;
  type: string;
  value: string;
  sensitive: boolean;
  message?: string;
}

export type ConfigValidation<A> = ValidConfig<A> | InvalidConfig;

interface ConfigValidationFields {
  valids: Valid<unknown>[];
  missingKeys: MissingKey[];
  malformedValues: MalformedValue[];
}

export interface ValidConfig<A> extends ConfigValidationFields {
  value: A;
}

export type InvalidConfig = ConfigValidationFields;

export type ShapeReader<A> = {
  [K in keyof A]: ConfigReader<A[K]> | ShapeReader<A[K]>;
};

export type Reader<A> = ConfigReader<A> | ShapeReader<A>;
