/* eslint-disable linebreak-style */
var
    geojsonNormalize = require('../lib/geojson-normalize');

var
    modal = require('./modal.js'),
    flash = require('./flash'),
    zoomextent = require('../lib/zoomextent'),
    readFile = require('../lib/readfile'),
    meta = require('../lib/meta.js'),
    saver = require('../ui/saver.js'),
    getFileNames = require('../source/local_server').getFileNames,
    getFile = require('../source/local_server').getFile,
    config = require('../config.js')(location.hostname);

/**
 * This module provides the file picking & status bar above the map interface.
 * It dispatches to source implementations that interface with specific
 * sources, like GitHub.
 */
module.exports = function fileBar(context) {

    // var shpSupport = typeof ArrayBuffer !== 'undefined';
    // var mapboxAPI = /a\.tiles\.mapbox.com/.test(L.mapbox.config.HTTP_URL);
    // var githubAPI = !!config.GithubAPI;
    // var githubBase = githubAPI ? config.GithubAPI + '/api/v3': 'https://api.github.com';

    function bar(selection) {
        var actions = [
            {
                title: 'Open'
            },
              {
                title: 'Save',
                action: saveAction
            }, {
                title: 'New',
                action: function() {
                    window.open(window.location.origin +
                        window.location.pathname + '#new');
                }
            },
            {
            title: 'Meta',
            action: function() {},
            children: [
                {
                    title: 'Add map layer',
                    alt: 'Add a custom tile layer',
                    action: function() {
                        var layerURL = prompt('Layer URL \n(http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg)');
                        if (layerURL === null) return;
                        var layerName = prompt('Layer name');
                        if (layerName === null) return;
                        meta.adduserlayer(context, layerURL, layerName);
                    }
                },
                {
                    title: 'Zoom to features',
                    alt: 'Zoom to the extent of all features',
                    action: function() {
                        meta.zoomextent(context);
                    }
                },
                {
                    title: 'Clear',
                    alt: 'Delete all features from the map',
                    action: function() {
                        if (confirm('Are you sure you want to delete all features from this map?')) {
                            meta.clear(context);
                        }
                    }
                }, {
                    title: 'Random: Points',
                    alt: 'Add random points to your map',
                    action: function() {
                        var response = prompt('Number of points (default: 100)');
                        if (response === null) return;
                        var count = parseInt(response, 10);
                        if (isNaN(count)) count = 100;
                        meta.random(context, count, 'point');
                    }
                }, {
                    title: 'Add bboxes',
                    alt: 'Add bounding box members to all applicable GeoJSON objects',
                    action: function() {
                        meta.bboxify(context);
                    }
                }, {
                    title: 'Flatten Multi Features',
                    alt: 'Flatten MultiPolygons, MultiLines, and GeometryCollections into simple geometries',
                    action: function() {
                        meta.flatten(context);
                    }
                }, {
                    title: 'Load encoded polyline',
                    alt: 'Decode and show an encoded polyline. Precision 5 is supported.',
                    action: function() {
                        meta.polyline(context);
                    }
                }, {
                    title: 'Load WKB Base64 Encoded String',
                    alt: 'Decode and show WKX data',
                    action: function() {
                        meta.wkxBase64(context);
                    }
                }, {
                    title: 'Load WKB Hex Encoded String',
                    alt: 'Decode and show WKX data',
                    action: function() {
                        meta.wkxHex(context);
                    }
                }, {
                    title: 'Load WKT String',
                    alt: 'Decode and show WKX data',
                    action: function() {
                        meta.wkxString(context);
                    }
                }
            ]
        }, {
                title: 'Toggle map screen',
                action: function() {
                    var map = document.querySelector('.map');
                    var right = document.querySelector('.right');
                    if (map.style.display !== 'none') {
                        map.style.display = 'none';
                        right.style.width = '100%';
                    } else {
                        map.style.display = 'initial';
                        right.style.width = '40%';
                    }
                }
            }
        ];

        var items = selection.append('div')
            .attr('class', 'inline')
            .selectAll('div.item')
            .data(actions);

        items = items.enter()
            .append('div')
            .attr('class', 'item')
            .merge(items);

        var buttons = items.append('a')
            .attr('class', 'parent')
            .on('click', function(d) {
                if (d.action) d.action.apply(this, d);
            })
            .text(function(d) {
                return ' ' + d.title;
            });

        function updateSubmenus() {
            items.each(function(d) {
                if (!d.children) return;
                d3.select(this)
                  .append('div')
                  .attr('class', 'children')
                  .call(submenu(d.children));
            });
        }

        updateSubmenus();

        getFileNames(function (fileNames) {
            actions[0].children = fileNames.map(function (file) {
              return {
                title: file,
                action: function () {
                  openFile(file);
                }
              };
            });
            updateSubmenus();
        });

        function openFile(name) {
            getFile(name, function(content) {
              localStorage.setItem('fileName', name);
              context.data.clear();
              var gj = geojsonNormalize(content);
              context.data.mergeFeatures(gj.features);
            });
        }

        var name = selection.append('div')
            .attr('class', 'name');

        var filename = name.append('span')
                  .attr('class', 'filename')
                  .text(localStorage.getItem('fileName') || 'no file selected');

        function saveAction() {
            if (d3.event) d3.event.preventDefault();
            saver(context);
        }

        function submenu(children) {
            return function(selection) {
                selection
                    .selectAll('a')
                    .data(children)
                    .enter()
                    .append('a')
                    .attr('title', function(d) {
                        if (d.title == 'File' || d.title == 'GitHub' || d.title == 'Gist' || d.title == 'Add map layer' || d.title == 'Zoom to features' || d.title == 'Clear' || d.title == 'Random: Points' || d.title == 'Add bboxes' || d.title == 'Flatten Multi Features') return d.alt;
                    })
                    .text(function(d) {
                        return d.title;
                    })
                    .on('click', function(d) {
                        d.action.apply(this, d);
                    });
            };
        }

        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+s', saveAction));
    }

    return bar;
};
