var connect = require('connect'),
    http = require('http'),

    apiGenie = require('./../index'),

    app = connect();

app.use(apiGenie({
    mocksRootPath: 'dev/mocks/',
    mocksMap: [
        {
            testRegExp: /^\/api\//i,
            path: 'api/',
        },
        {
            testRegExp: /^\/api2\//i,
            path: 'api2/',
        },
    ],
    forcedSubset: null,
    beVerbose: true
}));

app.use(function (req, res) {
    res.end('Hello outside API Genie!');
});

console.log('Listening on port 3000...\n')

http.createServer(app).listen(3000);
