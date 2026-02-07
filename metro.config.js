// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'db', // para bases de datos
  'sqlite' // para SQLite
);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'sql', 'cjs'];

module.exports = config;