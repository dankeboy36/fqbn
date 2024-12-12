import type { ConfigOption, ConfigValue } from 'ardunno-cli';
import assert from 'node:assert/strict';
import { FQBN, valid } from '../index';

describe('fqbn', () => {
  describe('valid', () => {
    it('should be OK without config options', () => {
      assert.ok(valid('a:b:c'));
    });

    it('should be OK with config options', () => {
      assert.ok(valid('a:b:c:o1=v1'));
    });

    it('should be OK with config option value is empty', () => {
      assert.ok(valid('a:b:c:o1='));
    });

    it('should be OK with multiple config options', () => {
      assert.ok(valid('a:b:c:o1=v1,o2=v2'));
    });

    it("should be OK with multiple equal ('=') signs in the value part", () => {
      assert.ok(valid('a:b:c:o1=v1='));
    });

    it('should be OK with empty vendor', () => {
      assert.ok(valid(':avr:uno'));
    });

    it('should be OK with empty arch', () => {
      assert.ok(valid('arduino::uno'));
    });

    it('should be OK with empty vendor and arch', () => {
      assert.ok(valid('::uno'));
    });

    it('should fail when invalid', () => {
      assert.strictEqual(valid('invalid'), undefined);
    });

    it('should fail when config key value is empty', () => {
      assert.strictEqual(valid('a:b:c:'), undefined);
    });

    it('should fail when too short', () => {
      assert.strictEqual(valid('a:b'), undefined);
    });

    it('should fail when too long', () => {
      assert.strictEqual(valid('a:b:c:d'), undefined);
    });

    it('should fail when invalid config options syntax', () => {
      assert.strictEqual(valid('a:b:c:o1=v1*'), undefined);
    });

    it('should fail when contains duplicate config options', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,o1=v2'), undefined);
    });

    it('should fail when has trailing comma (no config options)', () => {
      assert.strictEqual(valid('a:b:c,'), undefined);
    });

    it('should fail when has trailing comma (with config options)', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,'), undefined);
    });

    it('should fail when config options has trailing comma', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,o2=v2,'), undefined);
    });

    it('should fail when config options is empty', () => {
      assert.strictEqual(valid('a:b:c:o1=v1,,o2=v2'), undefined);
    });

    it('should fail when config option key is empty', () => {
      assert.strictEqual(valid('a:b:c:=v1'), undefined);
    });

    it('should rethrow unhandled errors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalid: any = undefined;
      assert.throws(() => valid(invalid), /TypeError: .* undefined .*/);
    });
  });

  describe('FQBN', () => {
    describe('constructor', () => {
      it('should create', () => {
        const fqbn = new FQBN('a:b:c');
        assert.strictEqual(fqbn.vendor, 'a');
        assert.strictEqual(fqbn.arch, 'b');
        assert.strictEqual(fqbn.boardId, 'c');
        assert.strictEqual(fqbn.options, undefined);
      });

      [
        'ardui_no:av_r:un_o',
        'arduin.o:av.r:un.o',
        'arduin-o:av-r:un-o',
        'arduin-o:av-r:un-o:a=b=c=d',
      ].map((fqbn) =>
        it(`should create: ${fqbn}`, () =>
          assert.doesNotThrow(() => new FQBN(fqbn)))
      );

      ['arduin-o:av-r:un=o', 'arduin?o:av-r:uno', 'arduino:av*r:uno'].map(
        (fqbn) =>
          it(`should not create: ${fqbn}`, () =>
            assert.throws(() => new FQBN(fqbn)))
      );

      it('should create with a config option', () => {
        const fqbn = new FQBN('a:b:c:o1=v1');
        assert.strictEqual(fqbn.vendor, 'a');
        assert.strictEqual(fqbn.arch, 'b');
        assert.strictEqual(fqbn.boardId, 'c');
        assert.deepStrictEqual(fqbn.options, { o1: 'v1' });
      });

      it('should create with multiple config options', () => {
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
        assert.throws(() => new FQBN('a:b:c:=v1'), /ConfigOptionError: .*/);
      });

      it('should error when has duplicate config options', () => {
        assert.throws(
          () => new FQBN('a:b:c:o1=v1,o1=v2'),
          /ConfigOptionError: .*/
        );
      });

      // https://github.com/arduino/arduino-cli/pull/2768
      // Run all tests from the reference implementation
      [
        // Check invalid characters in config keys
        [
          'arduino:avr:uno:cpu@=atmega',
          'arduino:avr:uno:cpu@atmega',
          'arduino:avr:uno:cpu=atmega,speed@=1000',
          'arduino:avr:uno:cpu=atmega,speed@1000',
        ],
        // Check invalid characters in config values
        [
          'arduino:avr:uno:cpu=atmega@',
          'arduino:avr:uno:cpu=atmega@extra',
          'arduino:avr:uno:cpu=atmega,speed=1000@',
          'arduino:avr:uno:cpu=atmega,speed=1000@extra',
        ],
      ]
        .flat()
        .map((fqbn) =>
          it('should error with invalid config syntax (arduino/arduino-cli#2768)', () =>
            assert.throws(() => new FQBN(fqbn), /ConfigOptionError: .*/))
        );
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
            values: [],
          })
        );
      });

      it('should error when config has duplicate options', () => {
        assert.throws(() =>
          new FQBN('a:b:c').withConfigOptions(
            {
              option: 'o1',
              values: [{ value: 'v1', selected: true }],
            },
            {
              option: 'o1',
              values: [{ value: 'v2', selected: true }],
            }
          )
        );
      });

      it('should error when an option has multiple selected values', () => {
        assert.throws(() =>
          new FQBN('a:b:c').withConfigOptions({
            option: 'o1',

            values: [
              { value: 'v1', selected: true },
              { value: 'v2', selected: true },
            ],
          })
        );
      });

      it('should be noop when there is no effective change', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=w2');
        const actual = fqbn.withConfigOptions(
          {
            option: 'o1',
            values: [
              { value: 'v1', selected: true },
              { value: 'v2', selected: false },
            ],
          },
          {
            option: 'o2',
            values: [
              { value: 'v2', selected: false },
              { value: 'w2', selected: true },
            ],
          }
        );
        assert.ok(fqbn === actual);
        assert.deepStrictEqual(actual.options, { o1: 'v1', o2: 'w2' });
      });

      it('should update the config options', () => {
        const fqbn = new FQBN('a:b:c:o1=v1,o2=v2');
        const actual = fqbn.withConfigOptions(
          {
            option: 'o3',
            values: [
              { value: 'x1', selected: true },
              { value: 'x2', selected: false },
            ],
          },
          {
            option: 'o2',
            values: [
              { value: 'v2', selected: false },
              { value: 'w2', selected: true },
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
        const cliConfigValue1: ConfigValue = {
          value: 'v1',
          valueLabel: 'V1',
          selected: true,
        };
        const cliConfigValue2: ConfigValue = {
          value: 'v2',
          valueLabel: 'V2',
          selected: false,
        };
        const cliOptions: ConfigOption[] = [
          {
            option: 'o1',
            optionLabel: 'O1', // Additional CLI props are allowed
            values: [cliConfigValue1, cliConfigValue2],
          },
        ];
        const actual = fqbn.withConfigOptions(...cliOptions);

        assert.strictEqual(actual.toString(), 'a:b:c:o1=v1');
        assert.deepStrictEqual(actual.options, {
          o1: 'v1',
        });
        assert.strictEqual(fqbn.toString(), 'a:b:c');
        assert.strictEqual(fqbn.options, undefined);
      });
    });
  });
});
