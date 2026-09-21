/* eslint-disable @typescript-eslint/no-require-imports -- the plugin is plain CommonJS for Expo. */
const { addReleaseSigning } = require('../withReleaseSigning') as {
  addReleaseSigning: (gradle: string) => string;
};

const TEMPLATE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled true
        }
    }
}`;

describe('withReleaseSigning', () => {
  it('signs release builds with the upload key when it is present', () => {
    const gradle = addReleaseSigning(TEMPLATE);
    expect(gradle).toContain("rootProject.file('../secrets/upload-keystore.properties')");
    expect(gradle).toMatch(
      /release \{\n\s+signingConfig rootProject\.file\(.*\) \? signingConfigs\.release : signingConfigs\.debug/,
    );
  });

  it('leaves debug builds on the debug key', () => {
    const gradle = addReleaseSigning(TEMPLATE);
    expect(gradle).toMatch(/debug \{\n\s+signingConfig signingConfigs\.debug\n/);
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = addReleaseSigning(TEMPLATE);
    expect(addReleaseSigning(once)).toBe(once);
  });

  it('fails loudly when the template changes shape', () => {
    expect(() => addReleaseSigning('android { signingConfigs { } buildTypes { } }')).toThrow(
      /no release build type/,
    );
  });
});
