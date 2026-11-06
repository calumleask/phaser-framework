const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  entry: {
    geometry: path.resolve(__dirname, 'src/geometry/index.ts'),
  },
  mode: 'production',
  devtool: 'source-map',
  experiments: {
    outputModule: true,
  },
  output: {
    filename: '[name].mjs',
    library: {
      type: 'module',
    },
    clean: false,
  },
  externalsType: 'module',
  externals: {
    phaser: 'phaser',
    './geometry': './geometry.mjs',
  },
});
