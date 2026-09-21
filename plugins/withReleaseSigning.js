/**
 * Signs local release builds with the Google Play upload key, when it exists.
 *
 * The key and its passwords live in `secrets/` (git-ignored), never in the
 * repository. Without them the release build keeps Expo's default debug
 * signature, so a fresh clone still builds. Cloud builds on EAS ignore this and
 * use the credentials stored in EAS instead.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// kliuye: release signing';

const SIGNING_CONFIG = `
        ${MARKER}
        release {
            def props = new Properties()
            def file = rootProject.file('../secrets/upload-keystore.properties')
            if (file.exists()) {
                file.withInputStream { props.load(it) }
                storeFile rootProject.file("../secrets/\${props['storeFile']}")
                storePassword props['storePassword']
                keyAlias props['keyAlias']
                keyPassword props['keyPassword']
            }
        }`;

const USE_WHEN_PRESENT = `signingConfig rootProject.file('../secrets/upload-keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug`;

function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;
  const withConfig = gradle.replace(/signingConfigs \{/, (open) => `${open}${SIGNING_CONFIG}`);
  const release = withConfig.indexOf('release {', withConfig.indexOf('buildTypes {'));
  if (release === -1) throw new Error('withReleaseSigning: no release build type in build.gradle');
  const debugUse = withConfig.indexOf('signingConfig signingConfigs.debug', release);
  if (debugUse === -1)
    throw new Error('withReleaseSigning: release build type has no signingConfig');
  return (
    withConfig.slice(0, debugUse) +
    USE_WHEN_PRESENT +
    withConfig.slice(debugUse + 'signingConfig signingConfigs.debug'.length)
  );
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = addReleaseSigning(mod.modResults.contents);
    return mod;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
