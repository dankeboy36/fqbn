<a name="readmemd"></a>

fqbn / [Exports](#modulesmd)

# fqbn

Arduino FQBN (Fully Qualified Board Name)

> **ⓘ** [What's the FQBN string?](https://arduino.github.io/arduino-cli/dev/FAQ/#whats-the-fqbn-string)

> **ⓘ** [This library is based on the official implementation of FQBN written in Go](https://pkg.go.dev/github.com/arduino/arduino-cli@v1.1.2-0.20241211160613-84fc413ad815/pkg/fqbn)

## Install

```sh
npm install fqbn
```

## Usage

CommonJS:

```js
const { FQBN, valid } = require('fqbn');
```

TypeScript:

```ts
import { FQBN, valid } from 'fqbn';
```

<a name="classesfqbnmd"></a>

[fqbn](#readmemd) / [Exports](#modulesmd) / FQBN

# Class: FQBN

FQBN stands for Fully Qualified Board Name. It has the following format:
`VENDOR:ARCHITECTURE:BOARD_ID[:MENU_ID=OPTION_ID[,MENU2_ID=OPTION_ID ...]]`,
with each `MENU_ID=OPTION_ID` being an optional key-value pair configuration.
Each field accepts letters (`A-Z` or `a-z`), numbers (`0-9`), underscores (`_`), dashes(`-`) and dots(`.`).
The special character `=` is accepted in the configuration value. The `VENDOR` and `ARCHITECTURE` parts can be empty.
For a deeper understanding of how FQBN works, you should understand the
[Arduino platform specification](https://arduino.github.io/arduino-cli/dev/platform-specification/).

## Table of contents

### Constructors

- [constructor](#constructor)

### Properties

- [arch](#arch)
- [boardId](#boardid)
- [options](#options)
- [vendor](#vendor)

### Methods

- [equals](#equals)
- [sanitize](#sanitize)
- [toString](#tostring)
- [withConfigOptions](#withconfigoptions)

## Constructors

### constructor

• **new FQBN**(`fqbn`): [`FQBN`](#classesfqbnmd)

Creates a new [FQBN](#classesfqbnmd) instance after parsing the raw FQBN string—errors when the FQBN string is invalid.

#### Parameters

| Name   | Type     | Description                  |
| :----- | :------- | :--------------------------- |
| `fqbn` | `string` | the raw FQBN string to parse |

#### Returns

[`FQBN`](#classesfqbnmd)

**`Example`**

```ts
// Valid FQBN.
const fqbn1 = new FQBN('arduino:samd:mkr1000');
assert.ok(fqbn1);
assert.strictEqual(fqbn1.vendor, 'arduino');
assert.strictEqual(fqbn1.arch, 'samd');
assert.strictEqual(fqbn1.boardId, 'mkr1000');
assert.strictEqual(fqbn1.options, undefined);
```

**`Example`**

```ts
// Valid FQBN with custom board options.
const fqbn2 = new FQBN('arduino:samd:mkr1000:o1=v1');
assert.ok(fqbn2);
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
```

**`Example`**

```ts
// Invalid FQBN.
assert.throws(() => new FQBN('invalid'));
```

## Properties

### arch

• `Readonly` **arch**: `string`

The architecture of the board. It can be an empty string.

---

### boardId

• `Readonly` **boardId**: `string`

The unique board identifier per [vendor](#vendor) and [architecture](#arch).

---

### options

• `Optional` `Readonly` **options**: `Readonly`\<`Record`\<`string`, `string`\>\>

Optional custom board options and their selected values.

---

### vendor

• `Readonly` **vendor**: `string`

The vendor identifier. It can be an empty string.

## Methods

### equals

▸ **equals**(`other`): `boolean`

`true` if the `other` [FQBN](#classesfqbnmd) equals `this`. The key order of the custom board configuration options is insignificant.

#### Parameters

| Name    | Type                     | Description     |
| :------ | :----------------------- | :-------------- |
| `other` | [`FQBN`](#classesfqbnmd) | the other FQBN. |

#### Returns

`boolean`

`true` if equals. Otherwise, `false`.

**`Example`**

```ts
// The key order of the custom board configuration options is insignificant when comparing two FQBNs.
assert.ok(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').equals(
    new FQBN('arduino:samd:mkr1000:o2=v2,o1=v1')
  )
);
```

---

### sanitize

▸ **sanitize**(): [`FQBN`](#classesfqbnmd)

This function returns a new [FQBN](#classesfqbnmd) instance that does not include any configuration options.

#### Returns

[`FQBN`](#classesfqbnmd)

the new FQBN

**`Example`**

```ts
// Removes the custom board config options.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').sanitize().toString(),
  'arduino:samd:mkr1000'
);
```

**`Example`**

```ts
// Returns the same instance when no custom board options are available.
const fqbn = new FQBN('arduino:samd:mkr1000');
assert.ok(fqbn === fqbn.sanitize());
```

---

### toString

▸ **toString**(`skipOptions?`): `string`

Generates the string representation of the FQBN instance.

#### Parameters

| Name          | Type      | Default value | Description                                                                                                      |
| :------------ | :-------- | :------------ | :--------------------------------------------------------------------------------------------------------------- |
| `skipOptions` | `boolean` | `false`       | When set to `true`, any custom board configuration options will not be serialized. The default value is `false`. |

#### Returns

`string`

The resulting string representation of the FQBN.

**`Example`**

```ts
// Generates the string representation of the FQBN.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000').toString(),
  'arduino:samd:mkr1000'
);
```

**`Example`**

```ts
// Keeps the order of the custom board option keys.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1').toString(),
  'arduino:samd:mkr1000:o1=v1'
);
```

**`Example`**

```ts
// Skips the config options from the serialization.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1').toString(true),
  'arduino:samd:mkr1000'
);
```

---

### withConfigOptions

▸ **withConfigOptions**(`...configOptions`): [`FQBN`](#classesfqbnmd)

Creates an immutable copy of the current Fully Qualified Board Name (FQBN) after updating the [custom board configuration options](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption).
Adds new configuration options and updates the existing ones. New entries are appended to the end of the FQBN, while the order of the existing options remains unchanged.

#### Parameters

| Name               | Type                              | Description                                                                                                                                                                                                                              |
| :----------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `...configOptions` | [`ConfigOption`](#configoption)[] | Configuration options to update the FQBN. These options are provided by the Arduino CLI through the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsresponse) command. |

#### Returns

[`FQBN`](#classesfqbnmd)

**`Example`**

```ts
Creates a new FQBN instance by appending the custom board options to the end of the original FQBN.
// creates a new FQBN instance by appending the custom board options to the end of the FQBN
const fqbn1 = new FQBN('arduino:samd:mkr1000');
const fqbn2 = fqbn1.withConfigOptions({
  option: 'o1',
  values: [
    { value: 'v1', selected: true },
    { value: 'v2', selected: false },
  ],
});
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
```

**`Example`**

```ts
// FQBNs are immutable.
assert.strictEqual(fqbn1.options, undefined);
assert.ok(fqbn2.options);
```

**`Example`**

```ts
// Always maintains the position of existing configuration option keys while updating the selected value.
const fqbn3 = fqbn2.withConfigOptions(
  {
    option: 'o1',
    values: [
      { value: 'v1', selected: false },
      { value: 'v2', selected: true },
    ],
  },
  {
    option: 'o2',
    values: [
      { value: 'v2', selected: true },
      { value: 'w2', selected: false },
    ],
  }
);
assert.deepStrictEqual(fqbn3.options, { o1: 'v2', o2: 'v2' });
```

<a name="modulesmd"></a>

[fqbn](#readmemd) / Exports

# fqbn

## Table of contents

### Classes

- [FQBN](#classesfqbnmd)

### Type Aliases

- [ConfigOption](#configoption)
- [ConfigValue](#configvalue)

### Functions

- [valid](#valid)

## Type Aliases

### ConfigOption

Ƭ **ConfigOption**: `Object`

A lightweight representation of a custom board [config option](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption) provided by the Arduino CLI.

#### Type declaration

| Name           | Type                                     | Description                                                             |
| :------------- | :--------------------------------------- | :---------------------------------------------------------------------- |
| `option`       | `string`                                 | ID of the configuration option. For identifying the option to machines. |
| `optionLabel?` | `string`                                 | Name of the configuration option for identifying the option to humans.  |
| `values`       | readonly [`ConfigValue`](#configvalue)[] | Possible values of the configuration option.                            |

---

### ConfigValue

Ƭ **ConfigValue**: `Object`

The bare minimum representation of the [`ConfigValue`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configvalue) provided by the CLI via the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsrequest) command.

#### Type declaration

| Name          | Type      | Description                                           |
| :------------ | :-------- | :---------------------------------------------------- |
| `selected`    | `boolean` | Whether the configuration option is selected.         |
| `value`       | `string`  | The configuration option value.                       |
| `valueLabel?` | `string`  | Label to identify the configuration option to humans. |

## Functions

### valid

▸ **valid**(`fqbn`): [`FQBN`](#classesfqbnmd) \| `undefined`

Returns the parsed [FQBN](#classesfqbnmd) if valid. Otherwise, `undefined`.

#### Parameters

| Name   | Type     | Description      |
| :----- | :------- | :--------------- |
| `fqbn` | `string` | the FQBN string. |

#### Returns

[`FQBN`](#classesfqbnmd) \| `undefined`

the parsed FQBN or `undefined`.

**`Example`**

```ts
// Valid FQBN.
assert.ok(valid('arduino:samd:mkr1000') instanceof FQBN);
```

**`Example`**

```ts
// Invalid FQBN.
assert.strictEqual(valid('invalid'), undefined);
```
