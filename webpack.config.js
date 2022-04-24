const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: "inline-cheap-module-source-map",//"cheap-module-source-map",
  entry: {
    'bundle': './src/index.js',
    'k-means-clustering-socks': './src/algorithms/k-means-clustering.socks.js'
  },
  output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
  },
  plugins: [
    new CopyWebpackPlugin({
        patterns: [
            {
              from: 'src/*.html',
              to: 'index.html'
            }
        ]
    })
  ],
  resolve: {
    extensions: ["*", ".js"],
    alias: {
        'node_modules': path.join(__dirname, 'node_modules'),
        'bower_modules': path.join(__dirname, 'bower_modules'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      }
    ]
  }
};
