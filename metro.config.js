// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// tools/ holds dev-only helpers (the demo backend and its local Postgres data).
// Keep Metro from crawling or bundling any of it.
const toolsDir = path.resolve(__dirname, 'tools');
const escaped = toolsDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toolsPattern = new RegExp(`^${escaped}(/|\\\\).*`);

const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  toolsPattern,
];

module.exports = config;
