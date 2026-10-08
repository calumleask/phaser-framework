const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    library: 'phfw',
    libraryTarget: 'umd',
    globalObject: 'globalThis',
  },
  externals: {
    phaser: {
      commonjs: 'phaser',
      commonjs2: 'phaser',
      amd: 'phaser',
      root: 'Phaser',
    },
  },
});
