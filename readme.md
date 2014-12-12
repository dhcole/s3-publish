# s3-publish

Simple node.js application that syncs a local directory with a bucket on S3.

Makes serving a static website from S3 easy, especially when used with CloudFront for SSL.

Worked by checking a list of remote s3 objects, comparing them with local files in a specified directory, removing files on s3 but not in the folder, and uploading new or replacing other files. Adds a caching header and applies gzip compression to specified files. 

## configuration

Set configuration as a json file:

```json
{
  "bucket": "my.s3.bucket.name",
  "directory": "/path/to/my/website/_site",
  "compress": "html|css|js|json",
  "cache": "max-age=60"
}
```

- `bucket` an S3 bucket
- `directory` local directory to sync with bucket
- `compress` regex match for files to apply gzip compression
- `cache` `Cache-control` header value

Uses the AWS Javascript SDK, so it reads your AWS credentials from environment variables or a local file. [See more here](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

## install and run

Run with the config file path (e.g. `~/path-to/config.json`) as an argument.

```
$ npm install
$ node app.js [config file]
```
