const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Customize the config for Metro bundler
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Disable problematic plugins
config.serializer = {
  ...config.serializer,
  customSerializer: undefined,
};

module.exports = config;
