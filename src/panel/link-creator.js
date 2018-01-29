var getLinks = require('../source/local_server').getLinks;

module.exports = {
  linkCreator: linkCreator
};

function linkCreator(selection) {
  selection.each(function (d) {
    var sel = d3.select(this);

    var enter = sel.selectAll('div.link-creator').data([d]).enter()
      .append('div').attr('class', 'link-creator');
    if (enter.node() !== null) {
      var layerSelect = enter.append('select');
      var featureSelect = enter.append('select');
      var output = enter.append('input')
        .property('type', 'text')
        .on('focus', function () {
          this.select();
        });
      getLinks(function (links) {
        var layers = d3.set();
        links.forEach(function (link) {
          layers.add(link.layer);
        });
        layers = layers.values();

        layerSelect
          .selectAll('option')
          .data(layers)
          .enter()
          .append('option')
          .text(function (d) {
            return d;
          });

        function getSelectedDatum(select) {
          var si = select.node().selectedIndex;
          return select.selectAll('option')
            .filter(function (d, i) {
              return i === si;
            }).datum()
        }

        function updateFeatureSelect() {
          var layer = getSelectedDatum(layerSelect);
          featureSelect
            .html('')
            .selectAll('option')
            .data(links.filter(function (link) {
              return link.layer === layer;
            }))
            .enter()
            .append('option')
            .text(function (d2) {
              return '#' + d2.id + ' ' + d2.name;
            });
        }

        function updateLink() {
          var link = getSelectedDatum(featureSelect);
          output.property('value',
            '<a class=\'feature-link\' data-layer=\'' + link.layer + '\' data-feature=\'' + link.id + '\' href=\'#\'>');
        }

        layerSelect.on('change', updateFeatureSelect);
        featureSelect.on('change', updateLink);

        updateFeatureSelect();
        updateLink();
      });
    }
  });
};
