/* eslint-disable linebreak-style */

module.exports = {
  createTable: createTable
};

function createTable(keys) {
  var dispatcher = d3.dispatch('change', 'rowfocus');

  function table(selection) {
    selection.each(function(d) {
      var sel = d3.select(this),
        table;

      bootstrap();
      paint();

      function bootstrap() {
        var enter = sel.selectAll('table').data([d]).enter().append('table');
        var thead = enter.append('thead');
        var tbody = enter.append('tbody');
        var tr = thead.append('tr');
        tr.append('th')
          .text('id');
        var th = tr
          .selectAll('th.key')
          .data(keys)
          .enter()
          .append('th')
          .attr('class', 'key')
          .text(function (d) {
            return d.name;
          });

        table = sel.select('table');
      }

      function paint() {
        var tr = table.select('tbody').selectAll('tr')
          .data(function(d) {
            return d;
          });

        tr.exit().remove();

        tr = tr.enter().append('tr').merge(tr);
        tr.append('td')
          .text(function (d) {
            return d.id;
          });

        var td = tr.selectAll('td.key')
          .data(function(d, i) {
            return keys.map(function (k) {
              return {
                key: k,
                feature: d,
                index: i
              };
            });
          });

        td.exit().remove();

        td.enter()
          .append('td')
          .attr('class', 'key')
          .append('textarea')
          // .attr('contenteditable', true)
          .style('width', function (d) {
            if (d.key.style && d.key.style.width) {
              return d.key.style.width;
            } else {
              return null;
            }
          })
          .style('height', function (d) {
            if (d.key.style && d.key.style.height) {
              return d.key.style.height;
            } else {
              return null;
            }
          })
          .html(function (d) {
            return d.key.in(d.feature.properties[d.key.name]);
          })
          .on('keyup', write)
          .on('change', write)
          .on('focus', function(d) {
            dispatcher.call('rowfocus', dispatcher, d.feature, d.index);
          });

        function write(d) {
          d.feature.properties[d.key.name] = d.key.out(d3.select(this).node().value);
          dispatcher.call('change', dispatcher, d.feature, d.index);
        }

        // function mapToObject(m) {
        //   return m.entries()
        //     .reduce(function(memo, d) {
        //       memo[d.key] = d.value;
        //       return memo;
        //     }, {});
        // }

        // tr.selectAll('textarea')
        //   .data(function(d, i) {
        //     return d3.range(keys.length).map(function() {
        //       return {
        //         data: d,
        //         index: i
        //       };
        //     });
        //   })
        //   .classed('disabled', function(d) {
        //     return d.data[d3.select(this).attr('field')] === undefined;
        //   })
        //   .property('value', function(d) {
        //     var value = d.data[d3.select(this).attr('field')];
        //     return !isNaN(value) ? value : value || '';
        //   })
        //   .on('click', function(d) {
        //     if (d.data[d3.select(this).attr('field')] === undefined) {
        //       d.data[d3.select(this).attr('field')] = '';
        //       paint();
        //     }
        //   });
      }
    });
  }

  table.on = function () {
    dispatcher.on.apply(dispatcher, arguments);
    return table;
  };

  return table;
}
