import assert from 'node:assert/strict';
import { FQBN, valid } from '../index';

// valid FQBN
assert.ok(valid('arduino:samd:mkr1000') instanceof FQBN);
assert.ok(valid('arduino:samd:mkr1000:o1=v1') instanceof FQBN);

// invalid FQBN
assert.strictEqual(valid('invalid'), undefined);
