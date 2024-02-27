fqbn

# fqbn

## Table of contents

### Classes

- [FQBN](classes/FQBN.md)

### Type Aliases

- [ConfigOption](README.md#configoption)
- [ConfigOptions](README.md#configoptions)
- [ConfigValue](README.md#configvalue)
- [Optional](README.md#optional)

### Functions

- [valid](README.md#valid)

## Type Aliases

### ConfigOption

Ƭ **ConfigOption**: [`Optional`](README.md#optional)\<`Omit`\<`ApiConfigOption`, `"values"`\>, `"optionLabel"`\> & \{ `values`: [`ConfigValue`](README.md#configvalue)[] }

Lightweight representation of a custom board [config option](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption) provided by the Arduino CLI.

---

### ConfigOptions

Ƭ **ConfigOptions**: `Record`\<`string`, `string`\>

An object of custom board config options and the selected values.

---

### ConfigValue

Ƭ **ConfigValue**: [`Optional`](README.md#optional)\<`ApiConfigValue`, `"valueLabel"`\>

The bare minimum representation of the [`ConfigValue`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configvalue) provided by the CLI via the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsrequest) command.

---

### Optional

Ƭ **Optional**\<`T`, `K`\>: `Pick`\<`Partial`\<`T`\>, `K`\> & `Omit`\<`T`, `K`\>

From `T`, make properties those in type `K` optional.

Original source: https://stackoverflow.com/a/61108377/5529090

#### Type parameters

| Name | Type              |
| :--- | :---------------- |
| `T`  | `T`               |
| `K`  | extends keyof `T` |

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
