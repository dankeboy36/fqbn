import assert from 'node:assert/strict';
import { FQBN } from '../index';

// Creates a new FQBN instance by appending the custom board options extracted from the other FQBN to the end of the original FQBN.
const fqbn1 = new FQBN('arduino:samd:mkr1000');
const fqbn2 = fqbn1.withFQBN('arduino:samd:mkr1000:o1=v1');
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });

// FQBNs are immutable.
assert.strictEqual(fqbn1.options, undefined);
assert.ok(fqbn2.options);

// Always maintains the position of existing configuration option keys while updating the selected value.
const fqbn3 = fqbn2.withFQBN('arduino:samd:mkr1000:o2=v2,o1=v2');
assert.deepStrictEqual(fqbn3.options, { o1: 'v2', o2: 'v2' });
assert.deepStrictEqual(fqbn3.toString(), 'arduino:samd:mkr1000:o1=v2,o2=v2');

// Never removes config options.
const fqbn4 = fqbn3.withFQBN('arduino:samd:mkr1000');
assert.deepStrictEqual(fqbn4.options, { o1: 'v2', o2: 'v2' });
assert.deepStrictEqual(fqbn4.toString(), 'arduino:samd:mkr1000:o1=v2,o2=v2');

// Errors on mismatching FQBNs.
assert.throws(() => fqbn4.withFQBN('arduino:avr:uno:o1=v3'));
