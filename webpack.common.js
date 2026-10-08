const path = require('path');

const SRC_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'dist');

module.exports = {
  entry: {
    phfw: SRC_DIR + '/index.ts',
  },

  output: {
    path: BUILD_DIR,
    filename: '[name].js',
    clean: true,
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

  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
  },
};
