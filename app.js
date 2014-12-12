var fs = require('fs'),
    zlib = require('zlib'),
    mime = require('mime'),
    AWS = require('aws-sdk'),
    S3 = require('s3'),
    config = require(process.argv[2]);

var s3 = new AWS.S3({ params: { Bucket: config.bucket } }),
    s3Ext = S3.createClient( {
      s3Client: s3
    });

walk(config.directory, function(err, results) {
  if (err) throw err;

  // Remove s3 files that aren't in local directory
  var files = results.map(getFilename);
  diff(files, remove);

  results.forEach(function(file) {
    var filename = getFilename(file),
        contentType = mime.lookup(file),
        extension = mime.extension(contentType),
        charset = mime.charsets.lookup(contentType);

    // Add charset if it's known.
    if (charset) {
      contentType += '; charset=' + charset;
    }

    fs.readFile(file, function(err, data) {
      if (err) throw err;

      if ((new RegExp(config.compress)).test(extension)) {
        zlib.gzip(data, function(err, data) {
          if (err) throw err;
          upload({
            key: filename,
            body: data,
            contentType: contentType,
            encoding: 'gzip'
          });
        });
      } else {
        upload({
          key: filename,
          body: data,
          contentType: contentType
        });
      }

    });

  });

});

function diff(files, cb) {
  var s3Files = [];

  s3Ext.listObjects({})
    .on('error', function(err) {
      if (err) throw(err, err.stack);
    })
    .on('data', function(data) {
      s3Files = s3Files.concat(data.Contents);
    })
    .on('end', function() {
      s3Files = s3Files.map(function(o) { return o.Key; });
      compare(s3Files);
    });

  function compare(s3Files) {
    var difference = s3Files.filter(function(item) {
          return files.indexOf(item) < 0;
        });
    if (cb) cb(difference);
  }
}

function remove(files) {
  files.forEach(function(file) {
    s3.deleteObject({ Key: file }, function(err, data) {
      if (err) throw(err, err.stack); // an error occurred
      else console.log(data);         // successful response
    });
  });
}

function upload(opts) {
  var params = {
        Key: opts.key, /* required */
        Body: opts.body,
        CacheControl: config.cache,
        ContentType: opts.contentType
      };

  if (opts.encoding) {
    params.ContentEncoding = opts.encoding;
  }

  s3.putObject(params, function(err, data) {
    if (err) throw(err, err.stack); // an error occurred
    else console.log(data);         // successful response
  });
}

function getFilename(file) {
  return file.split(config.directory)[1].replace(/^\//g, '');
}

function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
