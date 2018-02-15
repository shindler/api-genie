var connect = require('connect'),
    http = require('http'),

    apiGenie = require('./../index'),

    app = connect();

app.use(apiGenie({
    mocksMap: [
        {
            testRegExp: /^\/api\//i,
            mocksRootPath: 'dev/mocks/api/',
        },
        {
            testRegExp: /^\/api2\//i,
            mocksRootPath: 'dev/mocks/api2/',
        },
    ],
    forcedSubset: 'CASE-123',
    beVerbose: true
}));

app.use(function (req, res) {
    res.end('Hello outside API Genie!');
});

http.createServer(app).listen(3000);
