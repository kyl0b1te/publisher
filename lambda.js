'use strict';

const dotenv = require('dotenv');

console.log(dotenv.config().parsed);


// const { publish } = require('./dist/index');

// exports.publisher = async () => await publish();
// (async () => await publish())();
