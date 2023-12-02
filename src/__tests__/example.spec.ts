import assert from 'node:assert/strict';

describe('example', function () {
  this.slow(500);

  it('README example should work', () => {
    assert.doesNotThrow(() => require('./example'));
  });
});
