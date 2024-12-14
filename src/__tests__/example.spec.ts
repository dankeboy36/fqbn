import assert from 'node:assert/strict';

describe('examples', function () {
  this.slow(1_000);

  it('new', () => assert.doesNotThrow(() => require('../__examples__/new')));

  it('withConfigOptions', () =>
    assert.doesNotThrow(() => require('../__examples__/withConfigOptions')));

  it('withConfigOptions', () =>
    assert.doesNotThrow(() => require('../__examples__/withFQBN')));

  it('sanitize', () =>
    assert.doesNotThrow(() => require('../__examples__/sanitize')));

  it('toString', () =>
    assert.doesNotThrow(() => require('../__examples__/toString')));

  it('equals', () =>
    assert.doesNotThrow(() => require('../__examples__/equals')));

  it('valid', () =>
    assert.doesNotThrow(() => require('../__examples__/valid')));
});
