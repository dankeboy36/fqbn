import type {
  ConfigOption as ApiConfigOption,
  ConfigValue as ApiConfigValue,
} from 'ardunno-cli';
import clone from 'clone';
import deepEqual from 'deep-equal';

export type ConfigValue = Optional<ApiConfigValue, 'valueLabel'>;
export type ConfigOption = Optional<
  Omit<ApiConfigOption, 'values'>,
  'optionLabel'
> & {
  values: ConfigValue[];
};

/**
 * The FQBN (fully qualified board name). It follows the following format:
 * ```
 * VENDOR:ARCHITECTURE:BOARD_ID[:MENU_ID=OPTION_ID[,MENU2_ID=OPTION_ID ...]]
 * ```
 */
export class FQBN {
  readonly vendor: string;
  readonly arch: string;
  readonly boardId: string;
  readonly options?: Readonly<ConfigOptions>;

  constructor(fqbn: string) {
    const [vendor, arch, boardId, rest] = fqbn.split(':');
    if (!vendor || !arch || !boardId) {
      throw new InvalidFQBNError(fqbn);
    }

    const options: Record<string, string> = {};
    if (typeof rest === 'string') {
      const tuples = rest.split(',');
      for (const tuple of tuples) {
        const [key, value, unexpected] = tuple.split('=');
        if (!key || !value || typeof unexpected === 'string') {
          throw new ConfigOptionError(
            fqbn,
            `Invalid config option syntax: '${tuple}'`
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
   * Adds the new config options and updates the existing ones.
   *
   * @param configOptions to update the FQBN with.
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

    const options: Mutable<ConfigOptions> = this.options
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

  sanitize(): FQBN {
    if (!hasConfigOptions(this)) {
      return this;
    }
    return new FQBN(this.toString(true));
  }

  toString(skipOptions = false): string {
    const { vendor, arch, boardId, options = {} } = this;
    return serialize(vendor, arch, boardId, skipOptions ? undefined : options);
  }

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
  options: ConfigOptions | undefined = undefined
): string {
  const configs = !options
    ? ''
    : Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
  return `${vendor}:${arch}:${boardId}${configs ? `:${configs}` : ''}`;
}

export function valid(fqbn: string): string | undefined {
  try {
    new FQBN(fqbn);
    return fqbn;
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

export class InvalidFQBNError extends Error {
  constructor(readonly fqbn: string) {
    super(`Invalid FQBN: ${fqbn}`);
    this.name = InvalidFQBNError.name;
  }
}

export class ConfigOptionError extends InvalidFQBNError {
  constructor(fqbn: string, readonly detail: string) {
    super(fqbn);
    this.name = ConfigOptionError.name;
  }
}

type ConfigOptions = Record<string, string>;
// https://stackoverflow.com/a/43001581/5529090
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
// https://stackoverflow.com/a/61108377/5529090
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
