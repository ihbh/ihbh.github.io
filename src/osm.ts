import * as dom from './dom';
import { TaggedLogger } from "./log";
import * as config from './config';

declare const ol; // OSM v5.3

const log = new TaggedLogger('osm');

export interface BBox {
  min: LonLat;
  max: LonLat;
}

export interface LonLat {
  lon: number; // lon = x-axis, west-to-east
  lat: number; // lat = y-axis, south-to-north
}

export class OSM {
  private mapid: string = null;
  private map = null; // ol.Map
  private ol = null;

  constructor(mapid: string) {
    this.mapid = mapid.replace('#', '');
  }

  async render(bbox: BBox) {
    log.i('Rendering OSM in #' + this.mapid,
      JSON.stringify(bbox));

    this.ol = await import(config.OSM_LIB);
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

  setBBox({ min, max }: BBox) {
    let ol = this.ol;

    let minpos = ol.proj.fromLonLat([min.lon, min.lat]);
    let maxpos = ol.proj.fromLonLat([max.lon, max.lat]);

    let extent = [...minpos, ...maxpos];

    let clat = (min.lat + max.lat) / 2;
    let clon = (min.lon + max.lon) / 2;

    this.map.getView().setCenter(
      ol.proj.fromLonLat([clon, clat]));

    this.map.getView().fit(extent);
  }

  addMarker({ lat, lon, opacity = 1 }) {
    let ol = this.ol;
    log.i(`marker: ${lat}, ${lon}`);

    let layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [
          new ol.Feature({
            geometry: new ol.geom.Point(
              ol.proj.fromLonLat([lon, lat]))
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
