'use strict';

const dotenv = require('dotenv');
const { publish } = require('./dist/index');

dotenv.config('./.env');

exports.publisher = async () => await publish();
