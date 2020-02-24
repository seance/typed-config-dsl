# typed-config-dsl

[![Travis build status](http://img.shields.io/travis/seance/typed-config-dsl/master.svg?style=flat-square)](https://travis-ci.org/seance/typed-config-dsl)


A focused, lightweight DSL for reading typed configuration from the environment.

## Features

- ✅ Clearly demarcate *required*, *optional* and *optional with default valued* keys
- 🔟 Statically type and correctly parse typed values, e.g. numbers and booleans
- 🚫 Strict format requirements &mdash; no lenient parsing or ambiguous configuration
- 📋 Analyze and provide feedback on the *whole* configuration on failure
- 👀 Provide means for marking sensitive keys and mask them appropriately

The library works well in combination with another configuration loading utility, such as [dotenv](https://www.npmjs.com/package/dotenv). Best taken advantage of with TypeScript, but even JavaScript projects benefit from its features.

## Examples

### Example usage

```typescript
import { readConfig, string, number, boolean } from 'typed-config-dsl';

interface Config {
  server: {
    interface: string;
    port: number;
  };
  basicAuth: {
    enabled: boolean;
    username: string | undefined;
    password: string | undefined;
  };
}

const config: Config = readConfig({
  server: {
    interface: string('SERVER_INTERFACE'),
    port: number('SERVER_PORT').default(8080),
  },
  basicAuth: {
    enabled: boolean('AUTH_ENABLED').default(false),
    username: string('AUTH_USERNAME').optional(),
    password: string('AUTH_PASSWORD').optional().sensitive(),
  },
});
```

### Example for valid config

Let's say the current environment would be as follows:

```json
{
  "SERVER_INTERFACE": "0.0.0.0",
  "SERVER_PORT": "443",
  "AUTH_ENABLED": "true",
  "AUTH_USERNAME": "user",
  "AUTH_PASSWORD": "secret"
}
```

Then `readConfig` in the above example would succeed, and log the following message:

```
Configuration read:
 - SERVER_INTERFACE string  0.0.0.0
 - SERVER_PORT      number  443
 - AUTH_ENABLED     boolean true
 - AUTH_USERNAME    string  user
 - AUTH_PASSWORD    string  (sensitive)
```

And return the following value (represented here as JSON):

```json
{
  "server": {
    "interface": "0.0.0.0",
    "port": 443
  },
  "basicAuth": {
    "enabled": true,
    "username": "user",
    "password": "secret"
  }
}
```

### Example for invalid config

Let's say the current environment would instead be as follows:

```json
{
  "SERVER_PORT": "443/https",
  "AUTH_ENABLED": "yes",
  "AUTH_USERNAME": "user",
  "AUTH_PASSWORD": "secret"
}
```

Then `readConfig` in the above example would throw an error with the following message:

```
Invalid configuration:
Missing values for following configuration keys:
 - SERVER_INTERFACE string
Malformed values for following configuration keys:
 - SERVER_PORT      number  443/https Badly formatted number
 - AUTH_ENABLED     boolean yes       Expected `true` or `false`
```

Notice the strict format requirement &mdash; although `parseFloat("443/https") === 443`, the value is rejected. In the same vein, `"yes"` is a *truthy* value, but so is `"no"`.

## DSL

The DSL is split into top-level combinators, which define *required* readers, and an extension DSL which provides utilities for defining *optional* and *sensitive* configuration keys.

### Top-level combinators

The top-level DSL consists of the `constant`, `string`, `number`, and `boolean` combinators, and `array` builder, which itself has combinators for `string`, `number` and `boolean`.

In addition, object literals with `ConfigReader<A>` leaf values can be used to read structured configuration. Such structures can be recursively nested.

#### `constant<A>`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`value`|`A`|n/a|The constant value to be returned by the reader.|

Builds a reader for a constant value. This is useful when you want to hard code a value in your configuration object.

*Example:*
```typescript
const reader: ConfigReader<number> = constant(42);
```

#### `string`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`key`|`string`|n/a|The key of the environment variable to read.|

Builds a *required* reader for a string-valued configuration key.

*Example:*
```typescript
const reader: ConfigReader<string> = string('FOO');
```

#### `number`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`key`|`string`|n/a|The key of the environment variable to read.|

Builds a *required* reader for a number-valued configuration key. The value is parsed using `readFloat` and checked to not be `NaN`.

*Example:*
```typescript
const reader: ConfigReader<number> = number('FOO');
```

#### `boolean`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`key`|`string`|n/a|The key of the environment variable to read.|

Builds a *required* reader for a boolean-valued configuration key. The value is required to be either `true` or `false`.

*Example:*
```typescript
const reader: ConfigReader<boolean> = boolean('FOO');
```

#### `array`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`key`|`string`|n/a|The key of the environment variable to read.|
|`separator`|`string`|`,`|The delimiter token for string splitting.|

An intermediate builder for array-valued configuration keys. Arrays are expected to be delimiter-separated string values and cannot be nested.

The value is parsed by splitting using string `.split(separator)` and then the resulting array values are parsed based on the element type combinator. Format requirements for the elements are the same as for the corresponding typed top-level combinators.

*Example:*
```typescript
const reader1: ConfigReader<string[]> = array('FOO').string();
const reader2: ConfigReader<number[]> = array('BAR', ';').number();
const reader3: ConfigReader<boolean[]> = array('ZUT', '|').boolean();
```

#### Object literals

Object literals can be used to create structured config entries. These can be recursively nested. The leaf values of such structures must be readers, produced e.g. with the DSL combinators.

*Example:*
```typescript
const reader = {
  foo: string('FOO'),
  bar: {
    baz: number('BAZ'),
    qux: boolean('QUX'),
  }
};
```

### Extension combinators

These combinators exist as methods on a `ConfigReader<A>`. If a reader is both optional (or has default value) and sensitive, then sensitive must be the last combinator. This convention is enforced by the DSL typings for consistency.

#### `optional`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`...environment`|`string[]`|`[]`|Names of environments in which the key is optional.|

Marks the extended reader as *optional*. It's type `A` is extended statically to be `A | undefined`.

*Example:*
```typescript
const reader: ConfigReader<number | undefined> = number('FOO').optional();
```

#### `default`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`defaultValue`|`A`|n/a|The value to be used if the key is not present.|
|`...environment`|`string[]`|`[]`|Names of environments in which the key is optional.|

Marks the extended reader as *optional* with a default value. It's static type remains unchanged.

*Example:*
```typescript
const reader: ConfigReader<boolean> = boolean('FOO').default(true);
```

#### `sensitive`

No parameters.

Marks the extended reader as *sensitive*. Sensitive values are masked when the successfully read configuration is logged and in output for failure messages.

*Example:*
```typescript
const reader: ConfigReader<string> = string('PASSWORD').sensitive();
```

## Reading configuration

The DSL specifies a `ConfigReader<A>` for some type `A`. To actually read a value of type `A` from the environment, `readConfig` is used.

### `readConfig<A>`

|Parameter|Type|Default|Description|
|---|---|---|---|
|`reader`|`ConfigLikeReader<A>`|n/a|The reader that will be used to read a value of type `A`.|
|`options`|`Options`|`defaultOptions`|Options for reading the configuration.|

Options, `defaultOptions` are as in the default column.

|Option|Type|Default|Description|
|---|---|---|---|
|`silent`|`boolean`|`false`|If `true`, don't log the successfully read configuration.|
|`logger`|`(message: string) => void`|`console.log`|A logger for logging messages.|

Reads a reader of type `A` which is specified using the DSL.

If the configuration read from the environment matches the specification, the configuration is logged (with valuess marked as sensitive masked) and a value of type `A` is returned.

If the configuration is not matched, e.g. some required key is missing or some value cannot be correctly parsed, an error with a description message detailing the status of the whole configuration is thrown.
