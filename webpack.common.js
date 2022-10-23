const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'dist');

module.exports = {
  entry: {
    phfw: SRC_DIR + '/index.ts',
  },

  output: {
    path: BUILD_DIR,
    filename: '[name].js',
    library: 'phfw',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        include: [SRC_DIR],
        loader: 'babel-loader',
      },
    ],
  },

  plugins: [new CleanWebpackPlugin()],

  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
  },
};
