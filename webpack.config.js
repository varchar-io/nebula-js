var path = require('path');
var nodeExternals = require('webpack-node-externals');

const resolveConfig = {
    alias: {
        "google-protobuf": path.resolve(__dirname, './node_modules/google-protobuf/'),
        "grpc": path.resolve(__dirname, './node_modules/@grpc/grpc-js'),
    },
    extensions: [
        ".ts",
        ".js",
        ".json"
    ],
    descriptionFiles: ['package.json'],
    modules: [
        "./node_modules"
    ],
};

const libApiConfig = {
    mode: "production",
    target: "node",
    context: __dirname,
    node: false,
    externals: [nodeExternals()],
    entry: {
        lib: './dist/index.js'
    },
    output: {
        // UMD works fine too, such as library='neb', libraryTarget='umd'
        // for commonjs, we rename the file ext as cjs for working better in ESM env.
        // note that, webpack doesn't crunch 'cjs' but 'js', so the file will be larger
        filename: './index.cjs',
        path: path.resolve(__dirname, 'dist'),
        library: '',
        libraryTarget: 'commonjs',
        libraryExport: 'default'
    },
    resolve: resolveConfig
};

module.exports = [libApiConfig];