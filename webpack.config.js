const path = require('path');


let main = {
    mode: 'development',
    target: 'electron-main',
    entry: path.join(__dirname, 'src', 'main'),
    output: {
        filename: 'main.js',
        path: path.join(__dirname, 'src')
    },
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        rules: [{
            test: /.ts?$/,
            include: [
                path.resolve(__dirname, 'src'),
            ],
            exclude: [
                path.resolve(__dirname, 'node_modules'),
            ],
            loader: 'ts-loader',
        }]
    },
    externals: [
        function(context, request, callback) {
          if (request.match(/devtron/)) {
            return callback(null, 'commonjs ' + request)
          }
          callback();
        }
    ],
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'inline-source-map'
};

let renderer = {
    mode: 'development',
    target: 'electron-renderer',
    entry: path.join(__dirname, 'src', 'ts/renderer'),
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'src', 'js')
    },
    module: {
        rules: [{
            test: /.ts?$/,
            include: [
                path.resolve(__dirname, 'src', 'ts'),
            ],
            exclude: [
                path.resolve(__dirname, 'node_modules'),
            ],
            loader: 'ts-loader',
        }]
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'inline-source-map'
};

let rendererPreload = {
    mode: 'development',
    target: 'electron-renderer',
    entry: path.join(__dirname, 'src', 'ts/preload'),
    output: {
        filename: 'preload.js',
        path: path.join(__dirname, 'src', 'js')
    },
    module: {
        rules: [{
            test: /.ts?$/,
            include: [
                path.resolve(__dirname, 'src', 'ts'),
            ],
            exclude: [
                path.resolve(__dirname, 'node_modules'),
            ],
            loader: 'ts-loader',
        }]
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'inline-source-map'
};

module.exports = [main, renderer, rendererPreload];
