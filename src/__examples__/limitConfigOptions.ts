import assert from 'node:assert/strict';
import { FQBN } from '../index';

// Keeps the first two config options.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3')
    .limitConfigOptions(2)
    .toString(),
  'arduino:samd:mkr1000:o1=v1,o2=v2'
);

// Limits the config options with a custom maximum.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3')
    .limitConfigOptions(3)
    .toString(),
  'arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3'
);

// Removes all config options when the limit is zero.
assert.strictEqual(
  new FQBN('arduino:samd:mkr1000:o1=v1').limitConfigOptions(0).toString(),
  'arduino:samd:mkr1000'
);
