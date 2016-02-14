var webpack = require('webpack');
var fs = require('fs');

var file = fs.readFileSync('./package.json', 'utf8');
var VERSION = JSON.parse(file).version;
var BANNER = 'carburator - ' + VERSION +
  ' https://github.com/jccazeaux/carburator\n' +
  ' Copyright (c) 2015 Jean-Christophe Cazeaux.\n' +
  ' Licensed under the MIT license.\n';

module.exports = {
  context: __dirname,
  entry: {
  	'carburator': './src/carburator',
  	'carburator.min': './src/carburator'
  },

  output: {
    path: './dist',
    filename: '[name].js',
    library: 'carburator',
    libraryTarget: 'umd'
  },
  
  plugins: [
   new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    }),
    new webpack.BannerPlugin(BANNER)
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        loader: 'babel-loader'
      }
    ]
  },

  resolve: {
    extensions: ['', '.js']
  }
}
