const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  experiments: {
    outputModule: true,
  },
  output: {
    filename: 'phfw.mjs',
    library: {
      type: 'module',
    },
    clean: false,
  },
  externalsType: 'module',
  externals: {
    phaser: 'phaser',
  },
});
