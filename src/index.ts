import clone from 'clone';
import deepEqual from 'deep-equal';

/**
 * The bare minimum representation of the [`ConfigValue`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configvalue) provided by the CLI via the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsrequest) command.
 */
export type ConfigValue = {
  /**
   * The configuration option value.
   */
  readonly value: string;
  /**
   * Label to identify the configuration option to humans.
   */
  readonly valueLabel?: string;
  /**
   * Whether the configuration option is selected.
   */
  readonly selected: boolean;
};

/**
 * A lightweight representation of a custom board [config option](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption) provided by the Arduino CLI.
 */
export type ConfigOption = {
  /**
   * ID of the configuration option. For identifying the option to machines.
   */
  readonly option: string;
  /**
   * Name of the configuration option for identifying the option to humans.
   */
  readonly optionLabel?: string;
  /**
   * Possible values of the configuration option.
   */
  readonly values: readonly ConfigValue[];
};

/**
 * FQBN stands for Fully Qualified Board Name. It has the following format:
 * `VENDOR:ARCHITECTURE:BOARD_ID[:MENU_ID=OPTION_ID[,MENU2_ID=OPTION_ID ...]]`,
 * with each `MENU_ID=OPTION_ID` being an optional key-value pair configuration.
 * Each field accepts letters (`A-Z` or `a-z`), numbers (`0-9`), underscores (`_`), dashes(`-`) and dots(`.`).
 * The special character `=` is accepted in the configuration value. The `VENDOR` and `ARCHITECTURE` parts can be empty.
 * For a deeper understanding of how FQBN works, you should understand the
 * [Arduino platform specification](https://arduino.github.io/arduino-cli/dev/platform-specification/).
 */
export class FQBN {
  /**
   * The vendor identifier. It can be an empty string.
   */
  readonly vendor: string;
  /**
   * The architecture of the board. It can be an empty string.
   */
  readonly arch: string;
  /**
   * The unique board identifier per {@link vendor vendor} and {@link arch architecture}.
   */
  readonly boardId: string;
  /**
   * Optional custom board options and their selected values.
   */
  readonly options?: Readonly<Record<string, string>>;

  /**
   * Creates a new {@link FQBN} instance after parsing the raw FQBN string—errors when the FQBN string is invalid.
   *
   * @param fqbn the raw FQBN string to parse
   *
   * @example
   * // Valid FQBN.
   * const fqbn1 = new FQBN('arduino:samd:mkr1000');
   * assert.ok(fqbn1);
   * assert.strictEqual(fqbn1.vendor, 'arduino');
   * assert.strictEqual(fqbn1.arch, 'samd');
   * assert.strictEqual(fqbn1.boardId, 'mkr1000');
   * assert.strictEqual(fqbn1.options, undefined);
   *
   * @example
   * // Valid FQBN with custom board options.
   * const fqbn2 = new FQBN('arduino:samd:mkr1000:o1=v1');
   * assert.ok(fqbn2);
   * assert.strictEqual(fqbn2.vendor, 'arduino');
   * assert.strictEqual(fqbn2.arch, 'samd');
   * assert.strictEqual(fqbn2.boardId, 'mkr1000');
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
   *
   * @example
   * // Invalid FQBN.
   * assert.throws(() => new FQBN('invalid'));
   */
  constructor(fqbn: string) {
    const fqbnSegments = fqbn.split(':');
    if (fqbnSegments.length < 3 || fqbnSegments.length > 4) {
      throw new InvalidFQBNError(fqbn);
    }
    for (let i = 0; i < 3; i++) {
      if (!/^[a-zA-Z0-9_.-]*$/.test(fqbnSegments[i])) {
        throw new InvalidFQBNError(fqbn);
      }
    }
    const [vendor, arch, boardId, rest] = fqbnSegments;
    if (!boardId) {
      throw new InvalidFQBNError(fqbn);
    }

    const options: Record<string, string> = {};
    if (typeof rest === 'string') {
      const tuples = rest.split(',');
      for (const tuple of tuples) {
        const configSegments = tuple.split('=', 2);
        if (configSegments.length !== 2) {
          throw new ConfigOptionError(
            fqbn,
            `Invalid config option: '${tuple}'`
          );
        }
        const [key, value] = configSegments;
        if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
          throw new ConfigOptionError(
            fqbn,
            `Invalid config option key: '${key}' (${tuple})`
          );
        }
        if (!/^[a-zA-Z0-9=_.-]*$/.test(value)) {
          throw new ConfigOptionError(
            fqbn,
            `Invalid config option value: '${value}' (${tuple})`
          );
        }
        const existingValue = options[key];
        if (existingValue) {
          throw new ConfigOptionError(
            fqbn,
            `Duplicate config options: ${key}:${existingValue}, ${key}:${value}`
          );
        }
        options[key] = value;
      }
    }

    this.vendor = vendor;
    this.arch = arch;
    this.boardId = boardId;
    if (Object.keys(options).length) {
      this.options = options;
    }
  }

  /**
   * Creates an immutable copy of the current Fully Qualified Board Name (FQBN) after updating the [custom board configuration options](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption).
   * Adds new configuration options and updates the existing ones. New entries are appended to the end of the FQBN, while the order of the existing options remains unchanged.
   *
   * @param configOptions Configuration options to update the FQBN. These options are provided by the Arduino CLI through the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsresponse) command.
   *
   * @example
   * // Creates a new FQBN instance by appending the custom board options to the end of the original FQBN.
   * const fqbn1 = new FQBN('arduino:samd:mkr1000');
   * const fqbn2 = fqbn1.withConfigOptions({
   *   option: 'o1',
   *   values: [
   *     { value: 'v1', selected: true },
   *     { value: 'v2', selected: false },
   *   ],
   * });
   * assert.strictEqual(fqbn2.vendor, 'arduino');
   * assert.strictEqual(fqbn2.arch, 'samd');
   * assert.strictEqual(fqbn2.boardId, 'mkr1000');
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
   *
   * @example
   * // FQBNs are immutable.
   * assert.strictEqual(fqbn1.options, undefined);
   * assert.ok(fqbn2.options);
   *
   * @example
   * // Always maintains the position of existing configuration option keys while updating the selected value.
   * const fqbn3 = fqbn2.withConfigOptions(
   *   {
   *     option: 'o1',
   *     values: [
   *       { value: 'v1', selected: false },
   *       { value: 'v2', selected: true },
   *     ],
   *   },
   *   {
   *     option: 'o2',
   *     values: [
   *       { value: 'v2', selected: true },
   *       { value: 'w2', selected: false },
   *     ],
   *   }
   * );
   * assert.deepStrictEqual(fqbn3.options, { o1: 'v2', o2: 'v2' });
   */
  withConfigOptions(...configOptions: readonly ConfigOption[]): FQBN {
    if (!configOptions.length) {
      return this;
    }
    const newOptions: Record<string, string> = {};
    for (const configOption of configOptions) {
      const key = configOption.option;
      const selected = configOption.values.filter((value) => value.selected);
      if (!selected.length) {
        throw new ConfigOptionError(
          this.toString(),
          `No selected value for config option: '${key}'`
        );
      }
      if (selected.length > 1) {
        throw new ConfigOptionError(
          this.toString(),
          `Multiple selected value for config option: '${key}'`
        );
      }
      const value = selected[0].value;
      const existingValue = newOptions[key];
      if (existingValue) {
        throw new ConfigOptionError(
          this.toString(),
          `Duplicate config options: ${key}:${existingValue}, ${key}:${selected}`
        );
      }
      newOptions[key] = value;
    }

    const options: Record<string, string> = this.options
      ? clone(this.options)
      : {};
    let didUpdate = false;
    for (const [key, newValue] of Object.entries(newOptions)) {
      const existingValue = options[key];
      if (existingValue !== newValue) {
        options[key] = newValue;
        didUpdate = true;
      }
    }

    if (!didUpdate) {
      return this;
    }

    const { vendor, arch, boardId } = this;
    return new FQBN(serialize(vendor, arch, boardId, options));
  }

  /**
   * Sets the configuration option to a specified value and returns a new FQBN instance.
   *
   * FQBNs are immutable, ensuring that existing configuration option keys are
   * maintained in their original positions during the update. By default, it
   * operates in non-strict mode, which allows for the insertion of new
   * configuration values without error. If strict mode is enabled, any attempt
   * to set a value for an absent configuration option will result in an error.
   *
   * @param option the config option identifier to update.
   * @param value the selected configuration option value to set.
   * @param [strict=false] Optional parameter to enable strict mode.
   *
   * @example
   * // Sets the configuration option to a specified value.
   * const fqbn1 = new FQBN('arduino:samd:mkr1000:o1=v1');
   * const fqbn2 = fqbn1.setConfigOption('o1', 'v2');
   * assert.strictEqual(fqbn2.vendor, 'arduino');
   * assert.strictEqual(fqbn2.arch, 'samd');
   * assert.strictEqual(fqbn2.boardId, 'mkr1000');
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v2' });
   *
   * @example
   * // FQBNs are immutable.
   * assert.deepStrictEqual(fqbn1.options, { o1: 'v1' });
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v2' });
   *
   * @example
   * // Always maintains the position of existing configuration option keys while updating the value.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2')
   *     .setConfigOption('o1', 'v2')
   *     .toString(),
   *   'arduino:samd:mkr1000:o1=v2,o2=v2'
   * );
   *
   * @example
   * // Inserts new configuration values by default (non-strict mode).
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000').setConfigOption('o1', 'v2').toString(),
   *   'arduino:samd:mkr1000:o1=v2'
   * );
   *
   * @example
   * // In strict mode, it throws an error when setting absent configuration option values.
   * assert.throws(() =>
   *   new FQBN('arduino:samd:mkr1000').setConfigOption('o1', 'v2', true)
   * );
   */
  setConfigOption(
    option: ConfigOption['option'],
    value: ConfigValue['value'],
    strict = false
  ): FQBN {
    const options = this.options ?? {};
    if (strict && !options[option]) {
      throw new ConfigOptionError(
        this.toString(),
        `Config option ${option} must be present in the FQBN (${this.toString()}) when using strict mode.`
      );
    }
    return this.withConfigOptions({
      option,
      values: [
        {
          value,
          selected: true,
        },
      ],
    });
  }

  /**
   * Creates an immutable copy of the current Fully Qualified Board Name (FQBN) after updating the custom board configuration options extracted from another FQBN.
   * New configuration options are added, and existing ones are updated accordingly.
   * New entries are appended to the end of the FQBN, while the order of the existing options remains unchanged.
   * If a configuration option is present in the current FQBN but absent in the other, the configuration option will still remain in place.
   * Note that errors will occur if the FQBNs do not match.
   *
   * @param fqbn the other {@link FQBN} to merge in
   *
   * @example
   * // Creates a new FQBN instance by appending the custom board options extracted from the other FQBN to the end of the original FQBN.
   * const fqbn1 = new FQBN('arduino:samd:mkr1000');
   * const fqbn2 = fqbn1.withFQBN('arduino:samd:mkr1000:o1=v1');
   * assert.strictEqual(fqbn2.vendor, 'arduino');
   * assert.strictEqual(fqbn2.arch, 'samd');
   * assert.strictEqual(fqbn2.boardId, 'mkr1000');
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
   *
   * @example
   * // FQBNs are immutable.
   * assert.strictEqual(fqbn1.options, undefined);
   * assert.ok(fqbn2.options);
   *
   * @example
   * // Always maintains the position of existing configuration option keys while updating the selected value.
   * const fqbn3 = fqbn2.withFQBN('arduino:samd:mkr1000:o2=v2,o1=v2');
   * assert.deepStrictEqual(fqbn3.options, { o1: 'v2', o2: 'v2' });
   * assert.deepStrictEqual(fqbn3.toString(), 'arduino:samd:mkr1000:o1=v2,o2=v2');
   *
   * @example
   * // Never removes config options.
   * const fqbn4 = fqbn3.withFQBN('arduino:samd:mkr1000');
   * assert.deepStrictEqual(fqbn4.options, { o1: 'v2', o2: 'v2' });
   * assert.deepStrictEqual(fqbn4.toString(), 'arduino:samd:mkr1000:o1=v2,o2=v2');
   *
   * @example
   * // Errors on mismatching FQBNs.
   * assert.throws(() => fqbn4.withFQBN('arduino:avr:uno:o1=v3'));
   */
  withFQBN(fqbn: string): FQBN {
    const other = new FQBN(fqbn);
    if (!this.sanitize().equals(other.sanitize())) {
      throw new ConfigOptionError(
        fqbn,
        `Mismatching FQBNs. this: ${this.toString()}, other: ${fqbn}`
      );
    }
    return this.withConfigOptions(
      ...Object.entries(other.options ?? {}).map(([option, value]) => ({
        option,
        values: [
          {
            value,
            selected: true,
          },
        ],
      }))
    );
  }

  /**
   * This function returns a new {@link FQBN} instance that does not include any configuration options.
   *
   * @returns the new FQBN
   *
   * @example
   * // Removes the custom board config options.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').sanitize().toString(),
   *   'arduino:samd:mkr1000'
   * );
   *
   * @example
   * // Returns the same instance when no custom board options are available.
   * const fqbn = new FQBN('arduino:samd:mkr1000');
   * assert.ok(fqbn === fqbn.sanitize());
   */
  sanitize(): FQBN {
    if (!hasConfigOptions(this)) {
      return this;
    }
    return new FQBN(this.toString(true));
  }

  /**
   * Returns an immutable copy of the FQBN limited to the first {@link maxOptions} configuration options.
   * When the instance already satisfies the limit, the current instance is returned.
   *
   * @param maxOptions The maximum number of configuration options to keep.
   * @returns The resulting {@link FQBN} instance.
   *
   * @example
   * // Keeps the first two config options.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3')
   *     .limitConfigOptions(2)
   *     .toString(),
   *   'arduino:samd:mkr1000:o1=v1,o2=v2'
   * );
   *
   * @example
   * // Limits the config options with a custom maximum.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3')
   *     .limitConfigOptions(3)
   *     .toString(),
   *   'arduino:samd:mkr1000:o1=v1,o2=v2,o3=v3'
   * );
   *
   * @example
   * // Removes all config options when the limit is set to zero.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1').limitConfigOptions(0).toString(),
   *   'arduino:samd:mkr1000'
   * );
   */
  limitConfigOptions(maxOptions: number): FQBN {
    if (!Number.isInteger(maxOptions) || maxOptions < 0) {
      throw new RangeError('maxOptions must be a non-negative integer');
    }
    const { options } = this;
    if (!options) {
      return this;
    }
    if (maxOptions === 0) {
      return this.sanitize();
    }
    const optionEntries = Object.entries(options);
    if (optionEntries.length <= maxOptions) {
      return this;
    }

    const limitedOptions: Record<string, string> = {};
    for (const [index, [key, value]] of optionEntries.entries()) {
      if (index >= maxOptions) {
        break;
      }
      limitedOptions[key] = value;
    }

    const { vendor, arch, boardId } = this;
    return new FQBN(serialize(vendor, arch, boardId, limitedOptions));
  }

  /**
   * Generates the string representation of the FQBN instance.
   *
   * @param skipOptions When set to `true`, any custom board configuration options will not be serialized. The default value is `false`.
   * @returns The resulting string representation of the FQBN.
   *
   * @example
   * // Generates the string representation of the FQBN.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000').toString(),
   *   'arduino:samd:mkr1000'
   * );
   *
   * @example
   * // Keeps the order of the custom board option keys.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1').toString(),
   *   'arduino:samd:mkr1000:o1=v1'
   * );
   *
   * @example
   * // Skips the config options from the serialization.
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1').toString(true),
   *   'arduino:samd:mkr1000'
   * );
   */
  toString(skipOptions = false): string {
    const { vendor, arch, boardId, options = {} } = this;
    return serialize(vendor, arch, boardId, skipOptions ? undefined : options);
  }

  /**
   * `true` if the `other` {@link FQBN} equals `this`. The key order of the custom board configuration options is insignificant.
   *
   * @param other the other FQBN.
   * @returns `true` if equals. Otherwise, `false`.
   *
   * @example
   * // The key order of the custom board configuration options is insignificant when comparing two FQBNs.
   * assert.ok(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').equals(
   *     new FQBN('arduino:samd:mkr1000:o2=v2,o1=v1')
   *   )
   * );
   */
  equals(other: FQBN): boolean {
    if (this === other) {
      return true;
    }
    return (
      this.vendor === other.vendor &&
      this.arch === other.arch &&
      this.boardId === other.boardId &&
      deepEqual(this.options, other.options, { strict: true })
    );
  }
}

function serialize(
  vendor: string,
  arch: string,
  boardId: string,
  options: Record<string, string> | undefined = undefined
): string {
  const configs = !options
    ? ''
    : Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
  return `${vendor}:${arch}:${boardId}${configs ? `:${configs}` : ''}`;
}

/**
 * Returns the parsed {@link FQBN} if valid. Otherwise, `undefined`.
 * @param fqbn the FQBN string.
 * @returns the parsed FQBN or `undefined`.
 *
 * @example
 * // Valid FQBN.
 * assert.ok(valid('arduino:samd:mkr1000') instanceof FQBN);
 *
 * @example
 * // Invalid FQBN.
 * assert.strictEqual(valid('invalid'), undefined)
 */
export function valid(fqbn: string): FQBN | undefined {
  try {
    return new FQBN(fqbn);
  } catch (err) {
    if (err instanceof InvalidFQBNError) {
      return undefined;
    }
    throw err;
  }
}

function hasConfigOptions(fqbn: FQBN): boolean {
  return !!fqbn.options && !!Object.keys(fqbn.options).length;
}

class InvalidFQBNError extends Error {
  constructor(readonly fqbn: string) {
    super(`Invalid FQBN: ${fqbn}`);
    this.name = InvalidFQBNError.name;
  }
}

class ConfigOptionError extends InvalidFQBNError {
  constructor(fqbn: string, readonly detail: string) {
    super(fqbn);
    this.name = ConfigOptionError.name;
  }
}
