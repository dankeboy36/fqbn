import assert from 'node:assert/strict';
import { FQBN } from '../index';

// valid FQBN
const fqbn1 = new FQBN('arduino:samd:mkr1000');
assert.ok(fqbn1);
assert.strictEqual(fqbn1.vendor, 'arduino');
assert.strictEqual(fqbn1.arch, 'samd');
assert.strictEqual(fqbn1.boardId, 'mkr1000');
assert.strictEqual(fqbn1.options, undefined);

// valid FQBN with custom board options
const fqbn2 = new FQBN('arduino:samd:mkr1000:o1=v1');
assert.ok(fqbn2);
assert.strictEqual(fqbn2.vendor, 'arduino');
assert.strictEqual(fqbn2.arch, 'samd');
assert.strictEqual(fqbn2.boardId, 'mkr1000');
assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });

// invalid FQBN
assert.throws(() => new FQBN('invalid'));
