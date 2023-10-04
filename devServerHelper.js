const connect = require('connect');
const http = require('http');

const apiGenie = require('./index');

const defServerConfig = require('./devServerConfig');
const bodyParser = require('body-parser');

module.exports = function (overwrites, done, port = 3000) {
    const app = connect();

    app.use(apiGenie(Object.assign({}, defServerConfig, overwrites || {})));

    app.use(function (req, res) {
        res.end('Hello outside API Genie!');
    });

    return http.createServer(app).listen(port);
};
