const path = require("path")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const webpack = require("webpack")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")

module.exports = {
    entry: ["react-hot-loader/patch", "webpack-hot-middleware/client", "./src/index.tsx"],

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(woff|woff2)$/,
                use: {
                    loader: "url-loader"
                }
            },
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    "react-hot-loader/webpack",
                    {
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true,
                            babelrc: false,
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        targets: {
                                            browsers: "last 2 versions"
                                        }
                                    } // or whatever your project requires
                                ],
                                "@babel/preset-typescript",
                                "@babel/preset-react"
                            ],
                            plugins: [
                                // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
                                ["@babel/plugin-proposal-decorators", { legacy: true }],
                                ["@babel/plugin-proposal-class-properties", { loose: true }],
                                "@babel/plugin-transform-runtime",
                                "react-hot-loader/babel"
                            ]
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"]
    },
    plugins: [
        new webpack.DefinePlugin({
            __ENV_NAME__: '"' + (process.env.REPLENISH_ENV || "local") + '"'
        }),
        new HtmlWebPackPlugin({
            template: "./src/index.html",
            filename: "./index.html"
        }),
        new webpack.HotModuleReplacementPlugin(),
        new ForkTsCheckerWebpackPlugin({
            eslint: {
                files: "./src/**/*.{ts,tsx,js,jsx}"
            }
        })
    ],
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    }
}
