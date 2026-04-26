const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Block backend and generator folders from Metro.
// This prevents the React Native app from showing the blue "Refreshing..."
// toast every time the AI agent writes code to the generated web app folders!
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  /.*\/backend\/.*/,
  /.*\/generator\/.*/,
  /.*\/generated\/.*/,
];

module.exports = config;
