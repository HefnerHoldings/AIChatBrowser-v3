const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip notarization if not building for distribution
  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false') {
    console.log('Skipping notarization (CSC_IDENTITY_AUTO_DISCOVERY is false)');
    return;
  }

  // Skip if no Apple ID credentials are provided
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.log('Skipping notarization (APPLE_ID or APPLE_ID_PASSWORD not set)');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log('Notarizing app...');
  
  try {
    await notarize({
      appBundleId: 'ai.madeasy.browser',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    });
    console.log('Notarization complete');
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't fail the build if notarization fails in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing despite notarization failure (development mode)');
    } else {
      throw error;
    }
  }
};