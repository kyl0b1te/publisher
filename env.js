'use strict';

const fs = require('fs');
const dotenv = require('dotenv');

fs.writeFileSync('.env.json', JSON.stringify(dotenv.config().parsed));
