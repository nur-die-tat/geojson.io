/* eslint-disable linebreak-style */
var smartZoom = require('../lib/smartzoom.js'),
  encodeHTML = require('encode-html'),
  decodeHTML = require('decode-html'),
  createTable = require('../panel/fixed-table').createTable;

function id(d) {
  return d;
}

var keys = [
  {
    name: 'id',
    in: id,
    out: function (s) {
      return parseInt(s);
    }
  },
  {
    name: 'name',
    in: id,
    out: id
  },
  {
    name: 'description',
    in: function (data) {
      if (!Array.isArray(data)) {
        data = [data];
      }
      return data.map(function (d) { return encodeHTML(d); }).join('</br>');
    },
    out: function (str) {
      return str.split('<br/>').map(function (s) { return decodeHTML(s); });
    }
  },
  {
    name: 'icon',
    in: id,
    out: id
  },
  {
    name: 'address',
    in: id,
    out: id
  },
  {
    name: 'begin',
    in: id,
    out: id
  },
  {
    name: 'end',
    in: id,
    out: id
  },
  {
    name: 'sources',
    in: function (data) {
      if (!Array.isArray(data)) {
        data = [data];
      }
      return data.map(function (d) { return encodeHTML(d); }).join('</br>');
    },
    out: function (str) {
      return str.split('<br/>').map(function (s) { return decodeHTML(s); });
    }
  }
];

module.exports = function(context) {
  function render(selection) {

    selection.html('');

    function rerender() {
      var geojson = context.data.get('map');

      var props;

      if (!geojson || !geojson.geometry &&
        (!geojson.features || !geojson.features.length)) {
        selection
          .html('')
          .append('div')
          .attr('class', 'blank-banner center')
          .text('no features');
      } else {
        props = geojson.geometry ? [geojson.properties] :
          geojson.features.map(getProperties);
        selection.select('.blank-banner').remove();
        selection
          .data([props])
          .call(createTable(keys)
            .on('change', function(row, i) {
              var geojson = context.data.get('map');
              if (geojson.geometry) {
                geojson.properties = row;
              } else {
                geojson.features[i].properties = row;
              }
              context.data.set('map', geojson);
            })
            .on('rowfocus', function(row, i) {
              var bounds = context.mapLayer.getBounds();
              var j = 0;
              context.mapLayer.eachLayer(function(l) {
                if (i === j++) smartZoom(context.map, l, bounds);
              });
            })
          );
      }
    }

    context.dispatch.on('change.table', function(evt) {
      rerender();
    });

    rerender();

    function getProperties(f) { return f.properties; }

    function zoomToMap(p) {
      var layer;
      // layers.eachLayer(function(l) {
      //     if (p == l.feature.properties) layer = l;
      // });
      return layer;
    }
  }

  render.off = function() {
    context.dispatch.on('change.table', null);
  };

  return render;
};


