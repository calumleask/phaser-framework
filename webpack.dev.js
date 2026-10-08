const { merge } = require('webpack-merge');
const common = require('./webpack.umd.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
});
