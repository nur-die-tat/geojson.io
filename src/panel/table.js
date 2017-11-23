var smartZoom = require('../lib/smartzoom.js');
  htmlEncode = require('encode-html'),
  htmlDecode = require('decode-html');

module.exports = function(context) {
    function render(selection) {

        selection.html('');

        function rerender() {
            // https://codepen.io/ashblue/pen/mCtuA
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

                let cols = []

                for (let prop of props) {
                  for (let attr of Object.keys(prop)) {
                      let type = typeof prop[attr];
                      if (!cols.filter(c => c.name === attr && c.type === type).length) {
                          cols.push({ name: attr, type })
                      }
                  }
                }

                let container = document.createElement('div');

                let button = document.createElement('button');
                button.innerHTML = 'add row';
                container.appendChild(button);

                let table = document.createElement('table');
                let tr = document.createElement('tr');
                for (let col of cols) {
                    let th = document.createElement('th');
                    th.innerHTML = col.name + ' (' + col.type + ')';
                    tr.appendChild(th);
                }
                table.appendChild(tr);

                for (let prop of props) {
                    let tr = document.createElement('tr');
                    for (let col of cols) {
                      let td = document.createElement('td');
                      td.setAttribute('contenteditable', true);
                      td.innerHTML = prop[col.name];
                      td.addEventListener('change', () => {
                      var content = prop[col.name];
                      if (typeof content === 'string') {
                        td.innerText = htmlEncode(content);
                      } else {
                        td.innerHTML = content;
                      }

                      td.addEventListener('change', function () {
                        debugger
                        var geojson = context.data.get('map');
                        if (geojson.geometry) {
                            geojson.properties[col.name] = convert(td.textContent, col.type);
                        } else {
                            geojson.features[i].properties = row;
                        }
                        context.data.set('map', geojson);
                      })
                      tr.appendChild(td);
                    }
                    table.appendChild(tr);
                }

                container.appendChild(table);

                container.addEventListener('click', () => console.log('asd'));

              selection[0][0].appendChild(container);

                //
                // selection.select('.blank-banner').remove();
                // selection
                //     .data([props])
                //     .call(metatable()
                //         .on('change', function(row, i) {
                //             var geojson = context.data.get('map');
                //             if (geojson.geometry) {
                //                 geojson.properties = row;
                //             } else {
                //                 geojson.features[i].properties = row;
                //             }
                //             context.data.set('map', geojson);
                //         })
                //         .on('rowfocus', function(row, i) {
                //             var bounds = context.mapLayer.getBounds();
                //             var j = 0;
                //             context.mapLayer.eachLayer(function(l) {
                //                 if (i === j++) smartZoom(context.map, l, bounds);
                //             });
                //         })
                //     );
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
