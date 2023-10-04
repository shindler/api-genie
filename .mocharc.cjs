module.exports = {
    "spec": "tests/**/*.spec.js",
    "diff": true,
    "extension": ["js"],
    "package": "./package.json",
    "reporter": "spec",
    "timeout": "2000",
    "ui": "bdd",
    "watch-files": ["lib/**/*.js", "tests/**/*.js"],
    "watch-ignore": ["lib/vendor"]
}
