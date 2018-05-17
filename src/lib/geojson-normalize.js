geojsonNormalize = require('geojson-normalize');

module.exports = function (geojson) {
  var normalized = geojsonNormalize(geojson);
  updateFeatureIds(normalized.features);
  return normalized;
};

function updateFeatureIds(features) {
  var maxId = features
    .map(function(f) {
      return f.id;
    }).filter(function (id) {
      return id != null;
    }).reduce(function (prev, next) {
      return Math.max(prev, next);
    }, 0);
  features.filter(function (f) {
      return f.id == null;
    }).forEach(function (f) {
      f.id = Math.max(Date.now(), maxId + 1);
      maxId = f.id;
    });
}