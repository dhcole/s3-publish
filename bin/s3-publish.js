#!/usr/bin/env node

var sync = require('../app');
if (process.argv[2]) sync(require(process.argv[2]), function(err, data) {
  if (err) throw(err, err.stack);             // an error occurred
  else console.log(data + '\nDone syncing.'); // successful response  
});
