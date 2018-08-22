const path = require('path');

module.exports = {
    entry: './app/js/app.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'build/scripts/')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: [['env', { modules: false }]]
                }
            }
        ]
    }
};
