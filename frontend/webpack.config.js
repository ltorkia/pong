const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader', 'postcss-loader'],
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'bundle.[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'public/index.html'),
		}),
	],
	devServer: {
			static: {
				directory: path.join(__dirname, 'public'),
			},
			historyApiFallback: true,
			compress: true,
			port: 3000,
			hot: true,
			open: true,
		},
};