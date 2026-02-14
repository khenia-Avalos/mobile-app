// mobile-app/metro.config.js - CREAR ESTE ARCHIVO
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.server = {
  port: 8081,
  host: '0.0.0.0',  // Aceptar conexiones de cualquier IP
  useGlobalHotkeys: false,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      return middleware(req, res, next);
    };
  }
};

config.watchFolders = [__dirname];

// Aumentar límite de watchers
config.maxWorkers = 2;
config.resetCache = true;

module.exports = config;