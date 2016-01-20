var express = require('express')
  , bodyParser = require('body-parser')
  , auth    = require('basic-auth-connect')
  , http    = require('http')
  , level   = require('level')

var db = level('./photos', {
  valueEncoding: 'json'
})

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// may need to add a ..
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.redirect('public/index.html')
})

app.put('/photos', function (req, res) {
  // store photo blob info in cache
  var blob = req.body
  console.log(blob)

  db.put(blob.url, blob, function (err, value) {
    if (err) res.status(500).send(err)
    else res.status(200).send()
  })
})

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

http.createServer(app).listen(3000)
