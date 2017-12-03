var
    clone = require('clone'),
    geojsonNormalize = require('geojson-normalize'),
    wellknown = require('wellknown');

var
    modal = require('./modal.js'),
    flash = require('./flash'),
    zoomextent = require('../lib/zoomextent'),
    readFile = require('../lib/readfile'),
    meta = require('../lib/meta.js'),
    saver = require('../ui/saver.js'),
    config = require('../config.js')(location.hostname);

var serverConf = require('../../server/config.json')

/**
 * This module provides the file picking & status bar above the map interface.
 * It dispatches to source implementations that interface with specific
 * sources, like GitHub.
 */
module.exports = function fileBar(context) {

    var shpSupport = typeof ArrayBuffer !== 'undefined';
    var mapboxAPI = /a\.tiles\.mapbox.com/.test(L.mapbox.config.HTTP_URL);
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


        // if (mapboxAPI || githubAPI) {
        //     actions.unshift({
        //         title: 'Open',
        //         children: [
        //             {
        //                 title: 'File',
        //                 alt: 'GeoJSON, TopoJSON, GTFS, KML, CSV, GPX and OSM XML supported',
        //                 action: blindImport
        //             }, {
        //                 title: 'GitHub',
        //                 alt: 'GeoJSON files in GitHub Repositories',
        //                 authenticated: true,
        //                 action: clickGitHubOpen
        //             }, {
        //                 title: 'Gist',
        //                 alt: 'GeoJSON files in GitHub Gists',
        //                 authenticated: true,
        //                 action: clickGist
        //             }
        //         ]
        //     });
        //     actions[1].children.unshift({
        //             title: 'GitHub',
        //             alt: 'GeoJSON files in GitHub Repositories',
        //             authenticated: true,
        //             action: clickGitHubSave
        //         }, {
        //             title: 'Gist',
        //             alt: 'GeoJSON files in GitHub Gists',
        //             authenticated: true,
        //             action: clickGistSave
        //         });
        //
        //     if (mapboxAPI) actions.splice(3, 0, {
        //             title: 'Share',
        //             action: function() {
        //                 context.container.call(share(context));
        //             }
        //         });
        // } else {
        //     actions.unshift({
        //         title: 'Open',
        //         alt: 'CSV, GTFS, KML, GPX, and other filetypes',
        //         action: blindImport
        //     });
        // }

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

        items.each(function(d) {
            if (!d.children) return;
            d3.select(this)
                .append('div')
                .attr('class', 'children')
                .call(submenu(d.children));
        });

        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:' + serverConf.port + '/server/layers', true);
        xhr.responseType = 'json';
        xhr.addEventListener('load', function () {
            var openItem = items[0].filter(function(i) {
                return i.innerText === 'Open';
            })[0];

            d3.select(openItem)
              .append('div')
              .attr('class', 'children')
              .call(submenu(
                this.response.map(function (file) {
                    return {
                        title: file,
                        action: function () {
                            openFile(file);
                        }
                    };
                })
              ));
        });
        xhr.send();

        var name = selection.append('div')
            .attr('class', 'name');

        var filename = name.append('span')
                  .attr('class', 'filename')
                  .text(localStorage.getItem('fileName') || 'no file selected');

        function saveAction() {
            if (d3.event) d3.event.preventDefault();
            saver(context);
        }

        function openFile(name) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://localhost:' + serverConf.port + '/server/layers/' + name, true);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function () {
                localStorage.setItem('fileName', name);
                context.data.clear();
                var gj = geojsonNormalize(this.response);
                context.data.mergeFeatures(gj.features);
                zoomextent(context);
                filename.text(name);
            });
            xhr.send();
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

        context.dispatch.on('change.filebar', onchange);


        function onchange(d) {
            var data = d.obj,
                type = data.type,
                path = data.path;
            // if (mapboxAPI || githubAPI) filename
            //     .text(path ? path : 'unsaved')
            //     .classed('deemphasize', context.data.dirty);
            // if (mapboxAPI || githubAPI) filetype
            //     .attr('href', data.url)
            //     .attr('class', sourceIcon(type));
            // saveNoun(type == 'github' ? 'Commit' : 'Save');
        }

            if (err) {
                if (err.message) {
                    flash(context.container, err.message)
                        .classed('error', 'true');
                }
                return;
            }
        d3.select(document).call(
            d3.keybinding('file_bar')
                .on('⌘+o', function() {
                    blindImport();
                    d3.event.preventDefault();
                })
                .on('⌘+s', saveAction));
    }

    function allProperties(properties, key, value) {
        properties[key] = value;
        return true;
    }

    return bar;
};
