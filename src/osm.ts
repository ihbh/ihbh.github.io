import * as dom from './dom';
import { TaggedLogger } from "./log";
import * as config from './config';
import * as ol from 'ol';

const log = new TaggedLogger('osm');

export interface BBox {
  min: LonLat;
  max: LonLat;
}

export interface LonLat {
  lon: number; // lon = x-axis, west-to-east
  lat: number; // lat = y-axis, south-to-north
}

export interface Marker {
  id: string;
  lat: number;
  lon: number;
  onclick?: () => any;
  remove(): void;
}

async function importOpenLayersLib() {
  let ol = await import(config.OSM_LIB);
  window['ol'] = ol;
  return ol;
}

export class OSM {
  private mapid: string = null;
  private map: ol.Map = null;
  private ol = null;
  private markers = new Map<string, Marker>();

  onaddmarker: (pos: LonLat) => any;

  constructor(mapid: string) {
    this.mapid = mapid.replace('#', '');
  }

  async render(bbox: BBox) {
    log.i('Rendering OSM in #' + this.mapid,
      JSON.stringify(bbox));

    this.ol = await importOpenLayersLib();
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

    this.addClickHandler();
    bbox && await this.setBBox(bbox);
  }

  private addClickHandler() {
    this.map.on('singleclick', e => {
      let [lon, lat] = this.ol.proj.toLonLat(e.coordinate);
      log.d('map:singleclick', lat, lon);
      this.map.forEachLayerAtPixel(e.pixel, (layer) => {
        let key = layer.get('myKey');
        if (key) {
          log.d('layer:', key);
          this.fireMarkerClickEvent(key);
        } else if (this.onaddmarker) {
          log.d('Firing the addmarker event.');
          this.onaddmarker({ lon, lat });
        }
      });
    });
  }

  private fireMarkerClickEvent(key: string) {
    let marker = this.markers.get(key);
    if (!marker) return;

    let onclick = marker.onclick;
    if (!onclick) return;

    try {
      log.i(`Marker ${key}.onclick`);
      onclick();
    } catch (err) {
      log.w(`Marker ${marker.id}.onclick failed:`, err);
    }
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

  addMarker({ id = '', lat, lon, opacity = 1 }): Marker {
    let ol = this.ol;
    id = id || Math.random().toString(16).slice(2);
    log.i(`marker: id=${id}, lat=${lat}, lon=${lon}`);

    let layer = new ol.layer.Vector({
      myKey: id,
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
    this.markers.set(id, {
      id, lat, lon,
      remove: () => {
        if (!this.markers.has(id))
          throw new Error('Marker already deleted: ' + id);
        this.map.removeLayer(layer);
        this.markers.delete(id);
      },
    });

    return this.markers.get(id);
  }

  clearMarkers() {
    let markers = [...this.markers.values()];
    for (let marker of markers)
      marker.remove();
  }
}
