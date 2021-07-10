const express = require("express")
const webpack = require("webpack")
const path = require("path")
const webpackHotMiddleware = require("webpack-hot-middleware")
const webpackDevMiddleware = require("webpack-dev-middleware")

const app = express()
const config = require("./webpack.dev.js")
const compiler = webpack(config)

// Tell express to use the webpack-dev-middleware and use the webpack.common.js
// configuration file as a base.
app.use(
    webpackDevMiddleware(compiler, {
        /* webpack middleware options */
    })
).use(webpackHotMiddleware(compiler))

app.use(express.static(path.join(__dirname, "/dist")))
app.use(express.static(path.join(__dirname, "/public")))

app.get("*", function (request, response) {
    response.sendFile(path.resolve(__dirname, "dist", "index.html"))
})

app.listen(3000, function () {
    console.log("Traders Club app listening on port 3000!\n")
})
