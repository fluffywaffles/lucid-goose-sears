var express = require('express')
  , auth    = require('basic-auth-connect')
  , http    = require('http')

var app = express()

// may need to add a ..
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.redirect('dist/index.html')
})

http.createServer(app).listen(3000)
