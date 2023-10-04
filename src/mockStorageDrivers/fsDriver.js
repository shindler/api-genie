const fs = require('fs');

module.exports = {
    pathExists,
    pathRead,
};

function pathExists(location) {
    return fs.existsSync(location);
}

function pathRead(location) {
    return fs.readFileSync(location, { encoding: 'utf8', flag: 'r' }).trim();
}



