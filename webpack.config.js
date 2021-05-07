const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  devtool: 'source-map',
  plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                  from: 'src/*.html',
                  to: 'index.html'
                }
            ]
        })
    ]
};
