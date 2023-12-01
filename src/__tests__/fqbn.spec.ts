import assert from 'node:assert/strict';
import { FQBN, valid } from '../fqbn';

describe('fqbn', () => {
  describe('valid', () => {
    it('should be OK without config options', () => {
      assert.ok(valid('a:b:c'));
    });

    it('should be OK with config options', () => {
      assert.ok(valid('a:b:c:o1=v1'));
    });

    it('should be OK with multiple config options', () => {
      assert.ok(valid('a:b:c:o1=v1,o2=v2'));
    });

    it('should fail when invalid', () => {
      assert.strictEqual(valid('invalid'), undefined);
    });

    it('should fail when has trailing comma', () => {
      assert.strictEqual(valid('a:b:c:'), undefined);
    });

    it('should fail when too short', () => {
      assert.strictEqual(valid('a:b'), undefined);
    });

    it('should fail when too long', () => {
      assert.strictEqual(valid('a:b:c:d'), undefined);
    });

    it('should fail when invalid config options syntax', () => {
      assert.strictEqual(valid('a:b:c:o1=v1='), undefined);
    });

    it('should fail when contains duplicate config options', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,o1=v2'), undefined);
    });

    it('should fail when config options has trailing comma', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,o2=v2,'), undefined);
    });

    it('should fail when config options is empty', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,,o2=v2'), undefined);
    });

    it('should rethrow unhandled errors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalid: any = undefined;
      assert.throws(() => valid(invalid), /TypeError: .* undefined .*/);
    });
  });

  describe('fqbn', () => {
    describe('constructor', () => {
      it('should create', () => {
        const fqbn = new FQBN('a:b:c');
        assert.strictEqual(fqbn.vendor, 'a');
        assert.strictEqual(fqbn.arch, 'b');
        assert.strictEqual(fqbn.boardId, 'c');
        assert.strictEqual(fqbn.options, undefined);
      });

      it('should create with config option', () => {
        const fqbn = new FQBN('a:b:c:o1=v1');
        assert.strictEqual(fqbn.vendor, 'a');
        assert.strictEqual(fqbn.arch, 'b');
        assert.strictEqual(fqbn.boardId, 'c');
        assert.deepStrictEqual(fqbn.options, { o1: 'v1' });
      });

      it('should create with multi config options', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=v2');
        assert.strictEqual(fqbn.vendor, 'a');
        assert.strictEqual(fqbn.arch, 'b');
        assert.strictEqual(fqbn.boardId, 'c');
        assert.deepStrictEqual(fqbn.options, { o1: 'v1', o2: 'v2' });
      });

      it('should error when invalid FQBN', () => {
        assert.throws(
          () => new FQBN('a:b:'),
          /InvalidFQBNError: Invalid FQBN: a:b:/
        );
      });

      it('should error when invalid config options syntax', () => {
        assert.throws(() => new FQBN('a:b:c:o1='), /ConfigOptionError: .*/);
      });

      it('should error when has duplicate config options', () => {
        assert.throws(
          () => new FQBN('a:b:c:o1=v1,o1=v2'),
          /ConfigOptionError: .*/
        );
      });
    });

    describe('toString', () => {
      it('should return the string', () => {
        const actual = new FQBN('a:b:c').toString();
        assert.strictEqual(actual, 'a:b:c');
      });

      it('should return the string with config options', () => {
        const actual = new FQBN('a:b:c:o1=v1,o2=v2').toString();
        assert.strictEqual(actual, 'a:b:c:o1=v1,o2=v2');
      });

      it('should skip the config options on request', () => {
        const actual = new FQBN('a:b:c:o1=v1,o2=v2').toString(true);
        assert.strictEqual(actual, 'a:b:c');
      });
    });

    describe('sanitize', () => {
      it('should be noop when has no config options', () => {
        const fqbn = new FQBN('a:b:c');
        const actual = fqbn.sanitize();
        assert.ok(fqbn === actual);
        assert.strictEqual(actual.options, undefined);
      });

      it('should remove the config options', () => {
        const fqbn = new FQBN('a:b:c:o1=v1');
        const actual = fqbn.sanitize();
        assert.strictEqual(actual.vendor, 'a');
        assert.strictEqual(actual.arch, 'b');
        assert.strictEqual(actual.boardId, 'c');
        assert.strictEqual(actual.options, undefined);
        assert.strictEqual(actual.toString(), 'a:b:c');
      });
    });

    describe('equals', () => {
      it('should be true for this', () => {
        const fqbn = new FQBN('a:b:c');
        assert.ok(fqbn.equals(fqbn));
      });

      it('should be false when different vendor', () => {
        const fqbn = new FQBN('a:b:c');
        const other = new FQBN('x:b:c');
        assert.strictEqual(fqbn.equals(other), false);
      });

      it('should be false when different architecture', () => {
        const fqbn = new FQBN('a:b:c');
        const other = new FQBN('a:x:c');
        assert.strictEqual(fqbn.equals(other), false);
      });

      it('should be false when different board ID', () => {
        const fqbn = new FQBN('a:b:c');
        const other = new FQBN('a:b:x');
        assert.strictEqual(fqbn.equals(other), false);
      });

      it('should be false when different config options', () => {
        const fqbn = new FQBN('a:b:c:o1=v1');
        const other = new FQBN('a:b:c:o1=v2');
        assert.strictEqual(fqbn.equals(other), false);
      });

      it('should be true when config options order differ', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=v2');
        const other = new FQBN('a:b:c:o2=v2,o1=v1');
        assert.ok(fqbn.equals(other));
      });
    });

    describe('withConfigOptions', () => {
      it('should be noop when config options is empty', () => {
        const fqbn = new FQBN('a:b:c');
        const actual = fqbn.withConfigOptions();
        assert.ok(fqbn === actual);
        assert.strictEqual(actual.options, undefined);
      });

      it('should error when config options has no selected value', () => {
        assert.throws(() =>
          new FQBN('a:b:c').withConfigOptions({
            option: 'o1',
            optionLabel: 'O1',
            values: [],
          })
        );
      });

      it('should error when config has duplicate options', () => {
        assert.throws(() =>
          new FQBN('a:b:c').withConfigOptions(
            {
              option: 'o1',
              optionLabel: 'O1',
              values: [{ value: 'v1', valueLabel: 'V1', selected: true }],
            },
            {
              option: 'o1',
              optionLabel: 'O1',
              values: [{ value: 'v2', valueLabel: 'V2', selected: true }],
            }
          )
        );
      });

      it('should error when an option has multiple selected values', () => {
        assert.throws(() =>
          new FQBN('a:b:c').withConfigOptions({
            option: 'o1',
            optionLabel: 'O1',
            values: [
              { value: 'v1', valueLabel: 'V1', selected: true },
              { value: 'v2', valueLabel: 'V2', selected: true },
            ],
          })
        );
      });

      it('should be noop when there is no effective change', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=w2');
        const actual = fqbn.withConfigOptions(
          {
            option: 'o1',
            optionLabel: 'O1',
            values: [
              { value: 'v1', valueLabel: 'V1', selected: true },
              { value: 'v2', valueLabel: 'V2', selected: false },
            ],
          },
          {
            option: 'o2',
            optionLabel: 'O2',
            values: [
              { value: 'w1', valueLabel: 'W1', selected: false },
              { value: 'w2', valueLabel: 'W2', selected: true },
            ],
          }
        );
        assert.ok(fqbn === actual);
        assert.deepStrictEqual(actual.options, { o1: 'v1', o2: 'w2' });
      });

      it('should update the config options', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=w1');
        const actual = fqbn.withConfigOptions(
          {
            option: 'o3',
            optionLabel: 'O3',
            values: [
              { value: 'x1', valueLabel: 'X1', selected: true },
              { value: 'x2', valueLabel: 'X2', selected: false },
            ],
          },
          {
            option: 'o2',
            optionLabel: 'O2',
            values: [
              { value: 'w1', valueLabel: 'W1', selected: false },
              { value: 'w2', valueLabel: 'W2', selected: true },
            ],
          }
        );
        assert.strictEqual(actual.toString(), 'a:b:c:o1=v1,o2=w2,o3=x1');
        assert.deepStrictEqual(actual.options, {
          o1: 'v1',
          o2: 'w2',
          o3: 'x1',
        });
      });

      it('should create a new instance when updated', () => {
        const fqbn = new FQBN('a:b:c');
        const actual = fqbn.withConfigOptions({
          option: 'o1',
          optionLabel: 'O1',
          values: [
            { value: 'v1', valueLabel: 'V1', selected: true },
            { value: 'v2', valueLabel: 'V2', selected: false },
          ],
        });

        assert.strictEqual(actual.toString(), 'a:b:c:o1=v1');
        assert.deepStrictEqual(actual.options, {
          o1: 'v1',
        });
        assert.strictEqual(fqbn.toString(), 'a:b:c');
        assert.strictEqual(fqbn.options, undefined);
      });
    });
  });

  it('example', () => {
    // valid
    assert.ok(valid('arduino:samd:mkr1000'));
    assert.ok(valid('arduino:samd:mkr1000:o1=v1'));
    assert.strictEqual(valid('arduino:invalid'), undefined);

    const fqbn = new FQBN('arduino:samd:mkr1000');
    assert.strictEqual(fqbn.vendor, 'arduino');
    assert.strictEqual(fqbn.arch, 'samd');
    assert.strictEqual(fqbn.boardId, 'mkr1000');
    assert.strictEqual(fqbn.options, undefined);

    // withConfigOptions (add)
    const fqbn2 = fqbn.withConfigOptions({
      option: 'o1',
      optionLabel: 'O1',
      values: [
        { value: 'v1', valueLabel: 'V1', selected: true },
        { value: 'v2', valueLabel: 'V2', selected: false },
      ],
    });
    assert.strictEqual(fqbn2.vendor, 'arduino');
    assert.strictEqual(fqbn2.arch, 'samd');
    assert.strictEqual(fqbn2.boardId, 'mkr1000');
    assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });

    // withConfigOptions (add + update)
    const fqbn3 = fqbn2.withConfigOptions(
      {
        option: 'o1',
        optionLabel: 'O1',
        values: [
          { value: 'v1', valueLabel: 'V1', selected: false },
          { value: 'v2', valueLabel: 'V2', selected: true },
        ],
      },
      {
        option: 'o2',
        optionLabel: 'O2',
        values: [
          { value: 'w1', valueLabel: 'W1', selected: true },
          { value: 'w2', valueLabel: 'W2', selected: false },
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
    assert.ok(
      new FQBN('a:b:c:o1=v1,o2=v2').equals(new FQBN('a:b:c:o2=v2,o1=v1'))
    );
  });
});
