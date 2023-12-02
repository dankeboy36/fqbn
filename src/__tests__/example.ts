import assert from 'node:assert/strict';
import { FQBN, valid } from '../index';

// valid
assert.ok(valid('arduino:samd:mkr1000'));
assert.strictEqual(
  valid('arduino:samd:mkr1000:o1=v1'),
  'arduino:samd:mkr1000:o1=v1'
);
assert.strictEqual(valid('invalid'), undefined);

const fqbn = new FQBN('arduino:samd:mkr1000');
assert.strictEqual(fqbn.vendor, 'arduino');
assert.strictEqual(fqbn.arch, 'samd');
assert.strictEqual(fqbn.boardId, 'mkr1000');
assert.strictEqual(fqbn.options, undefined);

// withConfigOptions (add)
const fqbn2 = fqbn.withConfigOptions({
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

// immutable
assert.strictEqual(fqbn.options, undefined);

// withConfigOptions (add + update)
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
      { value: 'w1', selected: true },
      { value: 'w2', selected: false },
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
