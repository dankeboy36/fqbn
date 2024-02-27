import assert from 'node:assert/strict';
import { FQBN } from '../index';

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

// FQBNs are immutable
assert.strictEqual(fqbn1.options, undefined);
assert.ok(fqbn2.options);

// never changes the position of existing config option keys, but updates the selected value
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
