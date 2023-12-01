# fqbn

Arduino FQBN (fully qualified board name)

## Install

```sh
npm i fqbn
```

## Usage

```js
// valid
assert.ok(valid('arduino:samd:mkr1000'));
assert.ok(valid('arduino:samd:mkr1000:o1=v1'));
assert.strictEqual(valid('arduino:invalid'), undefined);

const fqbn = new FQBN('arduino:samd:mkr1000');
assert.strictEqual(fqbn.vendor, 'arduino');
assert.strictEqual(fqbn.arch, 'samd');
assert.strictEqual(fqbn.boardId, 'mkr1000');
assert.strictEqual(fqbn.options, undefined);

// withConfigOptions (add)
const fqbn2 = fqbn.withConfigOptions({
  option: 'o1',
  optionLabel: 'O1',
  values: [
    { value: 'v1', valueLabel: 'V1', selected: true },
    { value: 'v2', valueLabel: 'V2', selected: false },
  ],
});
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });

// withConfigOptions (add + update)
const fqbn3 = fqbn2.withConfigOptions(
  {
    option: 'o1',
    optionLabel: 'O1',
    values: [
      { value: 'v1', valueLabel: 'V1', selected: false },
      { value: 'v2', valueLabel: 'V2', selected: true },
    ],
  },
  {
    option: 'o2',
    optionLabel: 'O2',
    values: [
      { value: 'w1', valueLabel: 'W1', selected: true },
      { value: 'w2', valueLabel: 'W2', selected: false },
    ],
  }
);
assert.deepStrictEqual(fqbn3.options, { o1: 'v2', o2: 'w1' });

// toString
assert.strictEqual(fqbn.toString(), 'arduino:samd:mkr1000');
assert.strictEqual(fqbn2.toString(), 'arduino:samd:mkr1000:o1=v1');
assert.strictEqual(fqbn3.toString(), 'arduino:samd:mkr1000:o1=v2,o2=w1');
assert.strictEqual(fqbn3.toString(true), 'arduino:samd:mkr1000');

// sanitize
assert.strictEqual(fqbn3.sanitize().toString(), 'arduino:samd:mkr1000');

// equals
assert.ok(new FQBN('a:b:c:o1=v1,o2=v2').equals(new FQBN('a:b:c:o2=v2,o1=v1')));
```

## Development

1. Build

   ```sh
   npm run build
   ```

1. Test

   ```sh
   npm test
   ```
