const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'app': './src/index.js',
    'k-means-clustering-worker': './src/algorithms/k-means-clustering.worker.js'
  },
  output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
  },
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin({
        patterns: [
            {
              from: 'src/*.html',
              to: 'index.html'
            },
            {
              from: 'static',
              to: 'static'
            },
            {
              from: 'src/favicon.svg',
              to: 'favicon.svg'
            }
        ]
    })
  ],
  resolve: {
    alias: {
        'node_modules': path.join(__dirname, 'node_modules'),
        'bower_modules': path.join(__dirname, 'bower_modules'),
    }
  }
};
