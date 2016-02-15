var webpack = require('webpack');
var fs = require('fs');

var file = fs.readFileSync('./package.json', 'utf8');
var VERSION = JSON.parse(file).version;
var BANNER = 'diapason - ' + VERSION +
  ' https://github.com/jccazeaux/diapason\n' +
  ' Copyright (c) 2015 Jean-Christophe Cazeaux.\n' +
  ' Licensed under the MIT license.\n';

module.exports = {
  context: __dirname,
  entry: {
  	'diapason': './src/diapason',
  	'diapason.min': './src/diapason'
  },

  output: {
    path: './dist',
    filename: '[name].js',
    library: 'diapason',
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
