import assert from 'node:assert/strict';
import { FQBN } from '../index';

// removes the custom board config options
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').sanitize().toString(),
  'arduino:samd:mkr1000'
);

// returns the same instance when no custom board options are available
const fqbn = new FQBN('arduino:samd:mkr1000');
assert.ok(fqbn === fqbn.sanitize());
