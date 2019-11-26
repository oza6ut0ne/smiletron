const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/js/renderer.js',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'src/js')
    },
    devtool: 'inline-source-map'
};