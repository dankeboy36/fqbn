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
 * Lightweight representation of a custom board [config option](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption) provided by the Arduino CLI.
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
 * The special character `=` is accepted in the configuration value.
 * For a deeper understanding of how FQBN works, you should understand the
 * [Arduino platform specification](https://arduino.github.io/arduino-cli/dev/platform-specification/).
 */
export class FQBN {
  /**
   * The vendor identifier. Can be any empty string.
   */
  readonly vendor: string;
  /**
   * The architecture where the board belongs to.
   */
  readonly arch: string;
  /**
   * The unique board identifier per {@link vendor vendor} and {@link arch architecture}.
   */
  readonly boardId: string;
  /**
   * Optional object of custom board options and the selected values.
   */
  readonly options?: Readonly<Record<string, string>>;

  /**
   * Creates a new FQBN instance after parsing the raw FQBN string. Errors when the FQBN string is invalid.
   *
   * @param fqbn the raw FQBN string to parse
   *
   * @example
   * // valid FQBN
   * const fqbn1 = new FQBN('arduino:samd:mkr1000');
   * assert.ok(fqbn1);
   * assert.strictEqual(fqbn1.vendor, 'arduino');
   * assert.strictEqual(fqbn1.arch, 'samd');
   * assert.strictEqual(fqbn1.boardId, 'mkr1000');
   * assert.strictEqual(fqbn1.options, undefined);
   *
   * @example
   * // valid FQBN with custom board options
   * const fqbn2 = new FQBN('arduino:samd:mkr1000:o1=v1');
   * assert.ok(fqbn2);
   * assert.strictEqual(fqbn2.vendor, 'arduino');
   * assert.strictEqual(fqbn2.arch, 'samd');
   * assert.strictEqual(fqbn2.boardId, 'mkr1000');
   * assert.deepStrictEqual(fqbn2.options, { o1: 'v1' });
   *
   * @example
   * // invalid FQBN
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
   * Creates an immutable copy of the current FQBN after updating the [custom board config options](https://arduino.github.io/arduino-cli/latest/rpc/commands/#configoption).
   * Adds the new config options and updates the existing ones. New entries are appended to the end of the FQBN. Updates never changes the order.
   *
   * @param configOptions to update the FQBN with. The config options are provided by the Arduino CLI via the gRPC equivalent of the [`board --details`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#boarddetailsresponse) command.
   *
   * @example
   * // creates a new FQBN instance by appending the custom board options to the end of the FQBN
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
   * // FQBNs are immutable
   * assert.strictEqual(fqbn1.options, undefined);
   * assert.ok(fqbn2.options);
   *
   * @example
   * // never changes the position of existing config option keys, but updates the selected value
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
  withConfigOptions(...configOptions: ConfigOption[]): FQBN {
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
   * Returns a new FQBN instance without any config options.
   *
   * @returns the new FQBN
   *
   * @example
   * // removes the custom board config options
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1,o2=v2').sanitize().toString(),
   *   'arduino:samd:mkr1000'
   * );
   *
   * @example
   * // returns the same instance when no custom board options are available
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
   * Creates the string representation of the FQBN instance.
   *
   * @param skipOptions when `true`, any custom board config options won't be serialized. It's `false` by default.
   * @returns the string representation of the FQBN.
   *
   * @example
   * // creates the string representation of the FQBN
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000').toString(),
   *   'arduino:samd:mkr1000'
   * );
   *
   * @example
   * // keeps the order of the custom board option keys
   * assert.strictEqual(
   *   new FQBN('arduino:samd:mkr1000:o1=v1').toString(),
   *   'arduino:samd:mkr1000:o1=v1'
   * );
   *
   * @example
   * // can skip the config options from the serialization
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
   * `true` if the `other` FQBN equals to `this`. The custom board config options key order is insignificant.
   *
   * @param other the other FQBN to compare `this` with.
   * @returns `true` if equals. Otherwise, `false`.
   *
   * @example
   * // the custom board option keys order is insignificant when comparing two FQBNs
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
 * Returns the parsed FQBN if valid. Otherwise, `undefined`.
 * @param fqbn the FQBN string
 * @returns the parsed FQBN or `undefined`.
 *
 * @example
 * Parse a valid FQBN
 * ```ts
 * assert.ok(valid('arduino:samd:mkr1000') instanceof FQBN);
 * ```
 *
 * @example
 * `undefined` if the FQBN string is invalid
 * ```ts
 * assert.strictEqual(valid('invalid'), undefined)
 * ```
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
