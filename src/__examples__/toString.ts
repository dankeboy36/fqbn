import assert from 'node:assert/strict';
import { FQBN } from '../index';

// Generates the string representation of the FQBN.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000').toString(),
  'arduino:samd:mkr1000'
);

// Keeps the order of the custom board option keys.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1').toString(),
  'arduino:samd:mkr1000:o1=v1'
);

// Skips the config options from the serialization.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1').toString(true),
  'arduino:samd:mkr1000'
);
