module.exports = {
    globDirectory: 'build/',
    globPatterns: ['**/*.{js,css,html,mp4,webm}'],
    swDest: 'build/service-worker.js',
    runtimeCaching: [{
      urlPattern: /\.(mp4|webm)/,
      handler: 'CacheFirst'
    }]
  };