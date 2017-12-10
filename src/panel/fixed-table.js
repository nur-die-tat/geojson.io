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
        var th = tr
          .selectAll('th')
          .data(keys)
          .enter()
          .append('th')
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

        var td = tr.selectAll('td')
          .data(function(d, i) {
            return keys.map(function (k) {
              return {
                key: k,
                data: d,
                index: i
              };
            });
          });

        td.exit().remove();

        td.enter()
          .append('td')
          .append('div')
          .attr('contenteditable', true)
          .style('display', 'inline-block')
          .html(function (d) {
            return d.key.in(d.data[d.key.name]);
          })
          .on('keyup', write)
          .on('change', write)
          .on('focus', function(d) {
            dispatcher.call('rowfocus', dispatcher, d.data, d.index);
          });

        function write(d) {
          d.data[d.key.name] = d.key.out(d3.select(this).html());
          dispatcher.call('change', dispatcher, d.data, d.index);
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
