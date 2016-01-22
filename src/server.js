var express = require('express')
  , bodyParser = require('body-parser')
  , auth    = require('basic-auth-connect')
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
app.use(busboy())
app.set('s3bucket', process.env['AWS_S3_BUCKET'])

// may need to add a ..
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.redirect('public/index.html')
})

app.put('/photos', function (req, res) {
  // store photo blob info in cache
  if (req.busboy) {
    req.busboy.on('file', function (fieldName, file, filename, encoding, mimetype) {
      s3.upload({
        Bucket: app.get('s3bucket'),
        Key: '/photos/' + filename,
        Body: file
      }, function (err, data) {
        if (err) console.error(err), res.status(500).send(err)
        else {
          db.put(data.key, data, function (err, value) {
            if (err) console.error(err), res.status(500).send(err)
            else res.status(200).send(data)
          })
        }
      })
    })

    req.pipe(req.busboy)
  } else {
    res.status(500).send('No Busboy data found')
  }
})

app.put('/featured', function (req, res) {
  var featuredList = req.body
  console.log(featuredList)

  // NOTE(jordan): inefficiently remove dupes
  featuredList = featuredList.filter(function (f, idx, lst) {
    return lst.indexOf(f) == idx
  })

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

app.get('/photos', function (req, res) {
  var response = []
  db.createReadStream()
    .on('data', function (data) {
      if (data.key != 'featured')
        response.push(data.value)
    })
    .on('error', function (err) {
      console.error('An error occurred reading photos!')
      console.error(err)
      res.status(500).send(err)
    })
    .on('end', function () {
      res.send(response)
    })
})

function bucketUrl (object) {
  return 'https://' + app.get('s3bucket') + '.s3.amazonaws.com/' + object.Key
}

s3.listObjects({
  Bucket: app.get('s3bucket')
}, function (err, data) {
  if (err) console.error(err)
  else {
    console.log(data)
    console.log('Loaded S3 Images! Now to add to cache...')
    data.Contents.forEach(function (photo) {
      console.log(photo.Key)
      if (photo.Key.startsWith('photos/')) {
        var filename = photo.Key.substr(7)
        console.log(filename)
        if (filename.length > 0) {
          var url = bucketUrl(photo)
          console.log(url)
          var dataObject = {
            Location: url,
            Key: photo.Key
          }
          db.put(photo.Key, dataObject, function (err, value) {
            if (err) console.error(err)
            else console.info('Successfully cached URL for ', filename)
          })
        }
      }
      /*if (filename.length === 0) {
        console.log(s3.getSignedUrl('getObject', {
          Bucket: app.get('s3bucket'),
          Key: photo.Key
        }))
      }*/
    })
  }
})

http.createServer(app).listen(3000)
