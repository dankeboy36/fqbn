import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const examplesDirPath = path.join(__filename, '../../__examples__');

describe('examples', function () {
  this.slow(1_000);

  fs.readdirSync(examplesDirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) =>
      it(path.basename(dirent.name, path.extname(dirent.name)), () =>
        assert.doesNotThrow(() =>
          require(path.join(examplesDirPath, dirent.name))
        )
      )
    );
});
