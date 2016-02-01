var express = require('express')
  , bodyParser = require('body-parser')
  , basicAuth  = require('basic-auth-connect')
  , http    = require('http')
  , level   = require('level')
  , AWS     = require('aws-sdk')
  , busboy  = require('connect-busboy')
  , dotenv  = require('dotenv')

dotenv.load()

AWS.config.update({
  accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
  secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
})

var s3 = new AWS.S3()

var db = level('./photos', {
  valueEncoding: 'json'
})

var app = express()

app.use(bodyParser.json())
// NOTE(jordan): busboy handles FormData
app.use(busboy())
app.set('s3bucket', process.env['AWS_S3_BUCKET'])

app.put('/featured', function (req, res) {
  var featuredList = req.body
  console.log(featuredList)

  db.put('featured', featuredList, function (err, value) {
    if (err) res.status(500).send(err)
    else res.status(200).send()
  })
})

app.get('/featured', function (req, res) {
  db.get('featured', function (err, value) {
    if (err) {
      if (err.notFound) {
        db.put('featured', [], function (err, value) {
          if (err) res.status(500).send(err)
          else res.status(200).send(value)
        })
      } else res.status(500).send(err)
    } else res.status(200).send(value)
  })
})

app.put('/:resource', function (req, res) {
  if (req.busboy) {
    req.busboy.on('file', function (fieldName, file, filename, encoding, mimetype) {
      var md = JSON.parse(unescape(fieldName))
      s3.upload({
        Bucket: app.get('s3bucket'),
        Key: req.params.resource + '/' + filename,
        Body: file,
        Metadata: md // all the other shit we need
      }, function (err, data) {
        if (err) console.error(err), res.status(500).send(err)
        else {
          var dataObject = {
            Location: data.Location,
            Key: data.key,
            LastModified: new Date(),
            Metadata: md
          }
          db.put(data.key, dataObject, function (err, value) {
            if (err) console.error(err), res.status(500).send(err)
            else res.status(200).send(dataObject)
          })
        }
      })
    })

    req.pipe(req.busboy)
  } else {
    res.status(500).send('No Busboy data found')
  }
})

app.get('/:resource', function (req, res, next) {
  if (req.params.resource.search(/photos|newsletters/) !== 0)
    next()
  else {
    var response = []
    db.createReadStream()
      .on('data', function (data) {
        if (data.key.startsWith(req.params.resource))
          response.push(data.value)
      })
      .on('error', function (err) {
        console.error('An error occurred reading ' + req.params.resource + '!')
        console.error(err)
        res.status(500).send(err)
      })
      .on('end', function () {
        res.send(response)
      })
    }
})

app.delete('/:resource', function (req, res) {
  var deletionKey = req.query.key

  console.log('Delete S3 Key', deletionKey)

  s3.deleteObject({
    Bucket: app.get('s3bucket'),
    Key: deletionKey
  }, function (err, data) {
    if (err) console.error(err), res.status(500).send(err)
    else {
      db.del(deletionKey, function (err) {
        if (err) console.error(err)
        res.status(200).send(data)
      })
    }
  })
})

// NOTE(jordan): middleware order matters
app.use(basicAuth(
  process.env.BASIC_AUTH_USERNAME,
  process.env.BASIC_AUTH_PASSWORD
))

app.use(express.static('public'))

function bucketUrl (object) {
  return 'https://' + app.get('s3bucket') + '.s3.amazonaws.com/' + object.Key
}

var noStartupErr = true

// NOTE(jordan): ewwww pyramids of doom
s3.listObjects({
  Bucket: app.get('s3bucket')
}, function (err, data) {
  if (err) (noStartupErr = false), console.error(err)
  else {
    console.log('Loaded S3 Items! Now to add to cache...')
    data.Contents.forEach(function (photo) {
      s3.headObject({
        Bucket: app.get('s3bucket'),
        Key: photo.Key
      }, function (err, metadata) {
        if (err) (noStartupErr = false), console.error(err)
        else {
          if (photo.Key.search(/(photos|newsletters)\//) === 0) {
            var filename = photo.Key.split('/')[1]
            if (filename.length > 0) {
              var url = bucketUrl(photo)
              console.log('\n\n!! Cache data for:', url)
              var dataObject = {
                Location: url,
                Key: photo.Key,
                LastModified: photo.LastModified,
                Metadata: metadata.Metadata // NOTE(jordan): fuc u s3
              }
              console.log('\n\n==> Data to cache:\n\n', dataObject)
              console.log('\n\n===> METADATA:\n\n', metadata)
              db.put(photo.Key, dataObject, function (err, value) {
                if (err) console.error(err)
                else {
                  console.info('\n\n==> Successfully cached data for:\n\n', filename)
                }
              })
            }
          }
        }
      })
    })

    if (noStartupErr) startServer()
    else console.error('APP DID NOT START DUE TO FATAL ERRORS CACHING S3 DATA')
  }
})

function startServer () {
  http.createServer(app).listen(3000)
  console.log('Startup successful! App listening on port 3000.')
}
