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
    path: path.join(__dirname, 'dist'),
    hashFunction: "sha256"
  },
  node: {
    __dirname: false,
    __filename: false
  },
};

/** @type import('webpack').Configuration */
const renderer = {
  ...baseConfig,
  target: 'web',
  entry: path.join(__dirname, 'src/renderer/ts/renderer'),
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist/js'),
    hashFunction: "sha256"
  }
};

const preload = {
  ...baseConfig,
  target: 'electron-preload',
  entry: path.join(__dirname, 'src/preload/preload'),
  output: {
    filename: 'preload.js',
    path: path.join(__dirname, 'dist'),
    hashFunction: "sha256"
  }
};

module.exports = [main, renderer, preload];
