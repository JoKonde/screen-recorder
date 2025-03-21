module.exports = {
    globDirectory: 'build/',
    globPatterns: ['**/*.{js,css,html,mp4,webm,png,svg}'],
    swDest: 'build/service-worker.js',
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Augmentez la limite à 10MB
    runtimeCaching: [{
      urlPattern: /\.(mp4|webm)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'videos',
        expiration: {
          maxEntries: 10,
        },
      }
    }]
  };