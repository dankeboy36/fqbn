import assert from 'node:assert/strict';
import { FQBN } from '../index';

// Sets the configuration option to a specified value.
const fqbn1 = new FQBN('arduino:samd:mkr1000:o1=v1');
const fqbn2 = fqbn1.setConfigOption('o1', 'v2');
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v2' });

// FQBNs are immutable.
assert.deepStrictEqual(fqbn1.options, { o1: 'v1' });
assert.deepStrictEqual(fqbn2.options, { o1: 'v2' });

// Always maintains the position of existing configuration option keys while updating the value.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2')
    .setConfigOption('o1', 'v2')
    .toString(),
  'arduino:samd:mkr1000:o1=v2,o2=v2'
);

// Inserts new configuration values by default (non-strict mode).
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000').setConfigOption('o1', 'v2').toString(),
  'arduino:samd:mkr1000:o1=v2'
);

// In strict mode, it throws an error when setting absent configuration option values.
assert.throws(() =>
  new FQBN('arduino:samd:mkr1000').setConfigOption('o1', 'v2', true)
);
