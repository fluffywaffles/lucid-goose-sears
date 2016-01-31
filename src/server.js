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
      s3.upload({
        Bucket: app.get('s3bucket'),
        Key: req.params.resource + '/' + filename,
        Body: file,
        Metadata: JSON.parse(fieldName) // all the other shit we need
      }, function (err, data) {
        if (err) console.error(err), res.status(500).send(err)
        else {
          var dataObject = {
            Location: data.Location,
            Key: data.key,
            LastModified: new Date()
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

s3.listObjects({
  Bucket: app.get('s3bucket')
}, function (err, data) {
  if (err) console.error(err)
  else {
    console.log(data)
    console.log('Loaded S3 Items! Now to add to cache...')
    data.Contents.forEach(function (photo) {
      if (photo.Key.search(/(photos|newsletters)\//) === 0) {
        console.log(photo.Key)
        var filename = photo.Key.split('/')[1]
        if (filename.length > 0) {
          var url = bucketUrl(photo)
          console.log(url)
          var dataObject = {
            Location: url,
            Key: photo.Key,
            LastModified: photo.LastModified
          }
          db.put(photo.Key, dataObject, function (err, value) {
            if (err) console.error(err)
            else console.info('Successfully cached URL for ', filename)
          })
        }
      }
    })
  }
})

http.createServer(app).listen(3000)
