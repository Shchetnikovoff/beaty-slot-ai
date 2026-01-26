const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  // Enable React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Configure turbopack root to avoid Cyrillic path issues
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Отключить все индикаторы разработки Next.js
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};

module.exports = nextConfig;
