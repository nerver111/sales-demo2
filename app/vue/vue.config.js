module.exports = {
    devServer: {
      proxy: {
        '/odata/v4': {
          target: 'http://localhost:4004',
          changeOrigin: true
        }
      }
    }
  }