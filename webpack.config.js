const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

/** @type import('webpack').Configuration */
const baseConfig = {
  mode: isDev ? 'development' : 'production',
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
  devtool: isDev ? 'inline-cheap-module-source-map' : false,
};

/** @type import('webpack').Configuration */
const main = {
  ...baseConfig,
  target: 'electron-main',
  entry: {
    main: path.join(__dirname, 'src/main/main'),
  },
  output: {
    filename: 'main.js',
    path: path.join(__dirname, 'dist')
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: [
    function (context, request, callback) {
      if (request.match(/devtron/)) {
        return callback(null, 'commonjs ' + request)
      }
      callback();
    }
  ],
};

/** @type import('webpack').Configuration */
const renderer = {
  ...baseConfig,
  target: 'web',
  entry: path.join(__dirname, 'src/renderer/ts/renderer'),
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist/js')
  }
};

const preload = {
  ...baseConfig,
  target: 'electron-preload',
  entry: path.join(__dirname, 'src/renderer/ts/preload'),
  output: {
    filename: 'preload.js',
    path: path.join(__dirname, 'dist/js')
  }
};

module.exports = [main, renderer, preload];
