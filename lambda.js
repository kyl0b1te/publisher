'use strict';

const { publish } = require('./dist/index');

exports.publisher = async () => await publish();
// (async () => await publish())();
