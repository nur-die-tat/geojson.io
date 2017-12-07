var serverConf = require('../../server/config.json');

module.exports = {
  save: save,
  getFileNames: getFileNames,
  getFile: getFile
}

function getFileNames(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://localhost:' + serverConf.port + '/server/layers', true);
  xhr.responseType = 'json';
  xhr.addEventListener('load', function () {
    callback(this.response);
  });
  xhr.send();
}

function getFile(name, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://localhost:' + serverConf.port + '/server/layers/' + name, true);
  xhr.responseType = 'json';
  xhr.addEventListener('load', function () {
    callback(this.response);
  });
  xhr.send();
}

function save(context, callback) {
  var map = context.data.get('map');

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:' + serverConf.port + '/server/layers/' + localStorage.getItem('fileName'), true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.addEventListener('load', function () {
    callback(null, {
      type: 'local-server',
      content: map
    });
  });
  xhr.send(JSON.stringify(map, null, 2));
}
