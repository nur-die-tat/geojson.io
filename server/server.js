var express = require('express')
var app = express()
var conf = require('./config.json')
var fs = require('fs')
var path = require('path')
var bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use('/', express.static('./'))

//app.use('/local', express.static(conf.localDir))

app.get('/server/layers/', function (req, res) {
  var fileNames = fs.readdirSync(path.join(conf.localDir, 'layers')).map(function (file) {
    return path.parse(file).name
  })
  res.send(JSON.stringify(fileNames))
})

app.route('/server/layers/:file')
  .get(function (req, res) {
    res.send(fs.readFileSync(path.join(conf.localDir, 'layers', req.params.file + '.json'), 'utf-8'))
  })
  .post(function (req, res) {
    console.log(JSON.stringify(req.body, null, 2))
    fs.writeFileSync(path.join(conf.localDir, 'layers', req.params.file + '.json'), JSON.stringify(req.body, null, 2))
    res.send('ok')
  })

app.listen(conf.port)

console.log('serving on ' + conf.port)
