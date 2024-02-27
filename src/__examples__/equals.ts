import assert from 'node:assert/strict';
import { FQBN } from '../index';

// the custom board option keys order is insignificant when comparing two FQBNs
assert.ok(
  new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').equals(
    new FQBN('arduino:samd:mkr1000:o2=v2,o1=v1')
  )
);
