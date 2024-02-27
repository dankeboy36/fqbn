fqbn

# fqbn

## Table of contents

### Classes

- [FQBN](classes/FQBN.md)

### Type Aliases

- [ConfigOption](README.md#configoption)
- [ConfigValue](README.md#configvalue)

### Functions

- [valid](README.md#valid)

## Type Aliases

### ConfigOption

Ƭ **ConfigOption**: `Object`

Lightweight representation of a custom board [config option](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption) provided by the Arduino CLI.

#### Type declaration

| Name           | Type                                              | Description                                                             |
| :------------- | :------------------------------------------------ | :---------------------------------------------------------------------- |
| `option`       | `string`                                          | ID of the configuration option. For identifying the option to machines. |
| `optionLabel?` | `string`                                          | Name of the configuration option for identifying the option to humans.  |
| `values`       | readonly [`ConfigValue`](README.md#configvalue)[] | Possible values of the configuration option.                            |

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

▸ **valid**(`fqbn`): [`FQBN`](classes/FQBN.md) \| `undefined`

Returns the parsed FQBN if valid. Otherwise, `undefined`.

#### Parameters

| Name   | Type     | Description     |
| :----- | :------- | :-------------- |
| `fqbn` | `string` | the FQBN string |

#### Returns

[`FQBN`](classes/FQBN.md) \| `undefined`

the parsed FQBN or `undefined`.

**`Example`**

Parse a valid FQBN

```ts
assert.ok(valid('arduino:samd:mkr1000') instanceof FQBN);
```

**`Example`**

`undefined` if the FQBN string is invalid

```ts
assert.strictEqual(valid('invalid'), undefined);
```
