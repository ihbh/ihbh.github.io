define(["require", "exports", "./dom", "./log", "./config"], function (require, exports, dom, log_1, config) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('osm');
    class OSM {
        constructor(mapid) {
            this.mapid = null;
            this.map = null; // ol.Map
            this.ol = null;
            this.mapid = mapid.replace('#', '');
        }
        async render(bbox) {
            log.i('Rendering OSM in #' + this.mapid, JSON.stringify(bbox));
            this.ol = await new Promise((resolve_1, reject_1) => { require([config.OSM_LIB], resolve_1, reject_1); });
            let ol = this.ol;
            dom.loadStyles(config.OSM_CSS);
            this.map = new ol.Map({
                target: this.mapid,
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
            });
            await this.setBBox(bbox);
        }
        setBBox({ min, max }) {
            let ol = this.ol;
            let minpos = ol.proj.fromLonLat([min.lon, min.lat]);
            let maxpos = ol.proj.fromLonLat([max.lon, max.lat]);
            let extent = [...minpos, ...maxpos];
            let clat = (min.lat + max.lat) / 2;
            let clon = (min.lon + max.lon) / 2;
            this.map.getView().setCenter(ol.proj.fromLonLat([clon, clat]));
            this.map.getView().fit(extent);
        }
        addMarker({ lat, lon, opacity = 1 }) {
            let ol = this.ol;
            log.i(`marker: ${lat}, ${lon}`);
            let layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [
                        new ol.Feature({
                            geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
                        })
                    ]
                }),
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        opacity,
                        src: config.MARKER_ICON_URL,
                        size: [config.MARKER_ICON_SIZE, config.MARKER_ICON_SIZE],
                        scale: config.MARKER_ICON_SCALE,
                    })
                }),
            });
            this.map.addLayer(layer);
        }
    }
    exports.OSM = OSM;
});
//# sourceMappingURL=osm.js.map