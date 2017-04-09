import * as React from 'react';
import * as ol from 'openlayers';
import * as proj4 from 'proj4';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../../../common/layer-diff";
import * as assert from "../../../common/assert";

ol.proj.setProj4(proj4);


type OpenLayersObject = {
    container: HTMLElement;
    map: ol.Map;
}

/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name?: string|null;
    visible: boolean;
    image: string;
    state: string;
    latitude: number;
    longitude: number;
}

/**
 * Describes an image layer to be displayed on the OpenLayers map.
 */
export interface LayerDescriptor {
    id: string;
    name?: string|null;
    visible: boolean;
    opacity?: number;
    layerFactory: (layerSourceOptions: any) => ol.layer.Layer;
    layerSourceOptions: any;
}

export interface IOpenLayersMapProps extends IPermanentComponentProps {
    offlineMode?: boolean;
    pins?: PinDescriptor[];
    layers?: LayerDescriptor[];
    projectionCode?: string;
    onMapMounted?: (id: string, map: ol.Map) => void;
    onMapUnmounted?: (id: string, map: ol.Map) => void;
}

interface LastState {
    id: string;
    layers: LayerDescriptor[];
}

type LastStateMap = {[id: string]: LastState};

const EMPTY_ARRAY = [];

/**
 * A component that wraps an OpenLayers 4.0 2D Map.
 *
 * @author Norman Fomferra
 */
export class OpenLayersMap extends PermanentComponent<OpenLayersObject, IOpenLayersMapProps,any> {

    private lastStateMap: LastStateMap;

    constructor(props) {
        super(props);
        this.lastStateMap = {};
    }

    get map(): ol.Map {
        return this.permanentObject.map;
    }

    createPermanentObject(): OpenLayersObject {
        const container = this.createContainer();
        const options = {
            target: container,
            layers: [
                new ol.layer.Tile({
                    // source: new ol.source.OSM()
                    // source: new ol.source.CartoDB({}),
                    source: new ol.source.BingMaps({
                        key: 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci',
                        imagerySet: "Aerial",
                        reprojectionErrorThreshold: 2.5,
                    }),
                }),
                this.createEmptyVectorLayer(),
            ],
            view: new ol.View({
                projection: this.props.projectionCode || 'EPSG:4326',
                // projection: 'Glaciers_CCI_Greenland',
                center: [0, 0],
                zoom: 4,
            })
        };
        const map = new ol.Map(options);
        //map.addControl(new ol.control.ZoomSlider());
        //map.addControl(new ol.control.ScaleLine());
        //map.addControl(new ol.control.OverviewMap());
        //map.addControl(new ol.control.MousePosition());
        //map.addControl(new ol.control.Attribution());
        //map.addControl(new ol.control.Zoom());

        return {container, map};
    }

    componentWillReceiveProps(nextProps: IOpenLayersMapProps) {
        this.saveCurrentState();
        if (this.map) {
            if (this.props.projectionCode !== nextProps.projectionCode) {
                this.forceRegeneration();
            }
            this.updateMap(nextProps);
        }
    }

    permanentObjectMounted(permanentObject: OpenLayersObject): void {
        permanentObject.map.updateSize();
        this.updateMap(this.props);
        if (this.props.onMapMounted) {
            this.props.onMapMounted(this.props.id, permanentObject.map);
        }
    }

    permanentObjectUnmounted(permanentObject: OpenLayersObject): void {
        this.saveCurrentState();
        if (this.props.onMapUnmounted) {
            this.props.onMapUnmounted(this.props.id, permanentObject.map);
        }
    }

    private saveCurrentState() {
        const currentId = this.props.id;
        const currentLayers = this.props.layers || EMPTY_ARRAY;
        this.lastStateMap[currentId] = {id: currentId, layers: currentLayers};
    }

    private updateMap(props: IOpenLayersMapProps) {
        const nextId = props.id;
        const nextLayers = props.layers || EMPTY_ARRAY;

        const lastState = this.lastStateMap[nextId];
        const lastLayers = (lastState && lastState.layers) || EMPTY_ARRAY;

        this.updateMapLayers(lastLayers, nextLayers);
    }

    private updateMapLayers(currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        if (this.props.debug) {
            console.log('OpenLayersMap: updating layers');
        }
        const actions = getLayerDiff<LayerDescriptor>(currentLayers, nextLayers);
        let olLayer: ol.layer.Layer;
        let newLayer: LayerDescriptor;
        let oldLayer: LayerDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('OpenLayersMap: next layer action', action);
            }
            // olIndex is +1 because of its base layer at olIndex=0
            const olIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    olLayer = this.addLayer(action.newLayer, olIndex);
                    assert.ok(olLayer);
                    OpenLayersMap.setLayerProps(olLayer, action.newLayer);
                    break;
                case 'REMOVE':
                    this.removeLayer(olIndex);
                    break;
                case 'UPDATE':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Tile;
                    assert.ok(olLayer);
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.layerSourceOptions.url !== newLayer.layerSourceOptions.url) {
                        if (oldLayer.name === newLayer.name && typeof((olLayer.getSource() as any).setUrl) === 'function') {
                            if (this.props.debug) {
                                console.log('OpenLayersMap: reusing layer source');
                            }
                            // Reusable source: See http://openlayers.org/en/latest/examples/reusable-source.html?q=url
                            (olLayer.getSource() as ol.source.UrlTile).setUrl(newLayer.layerSourceOptions.url);
                        } else {
                            if (this.props.debug) {
                                console.log('OpenLayersMap: exchanging layer');
                            }
                            // Replace layer
                            this.removeLayer(olIndex);
                            olLayer = this.addLayer(newLayer, olIndex);
                        }
                    }
                    OpenLayersMap.setLayerProps(olLayer, action.newLayer, action.oldLayer);
                    break;
                case 'MOVE_DOWN':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Layer;
                    assert.ok(olLayer);
                    this.map.getLayers().removeAt(olIndex);
                    this.map.getLayers().insertAt(olIndex - action.numSteps, olLayer);
                    break;
                default:
                    console.error(`OpenLayersMap: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private addLayer(layerDescriptor: LayerDescriptor, layerIndex: number): ol.layer.Layer {
        const olLayer = layerDescriptor.layerFactory(layerDescriptor.layerSourceOptions);
        this.map.getLayers().insertAt(layerIndex, olLayer);
        if (this.props.debug) {
            console.log(`OpenLayersMap: added layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return olLayer;
    }

    private removeLayer(layerIndex: number): void {
        this.map.getLayers().removeAt(layerIndex);
        if (this.props.debug) {
            console.log(`OpenLayersMap: removed layer #${layerIndex}`);
        }
    }

    private static setLayerProps(olLayer: ol.layer.Layer, newLayer: LayerDescriptor, oldLayer?: LayerDescriptor) {
        if (!oldLayer || oldLayer.visible !== newLayer.visible) {
            olLayer.setVisible(newLayer.visible);
        }
        if (!oldLayer || oldLayer.opacity !== newLayer.opacity) {
            olLayer.setOpacity(newLayer.opacity);
        }
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "ol-container-" + this.props.id);
        div.setAttribute("class", "ol-container");
        return div;
    }

    /**
     * Creates an empty Vector layer that demonstrates using a custom loading strategy and loader.
     * This will be the basis for creating our own Vector pyramid for faster display of large Shapefiles.
     *
     * Note that "resolution" is given in map units per display pixel.
     */
    createEmptyVectorLayer() {
        function loader(extend: ol.Extent, resolution: number, projection: ol.proj.Projection) {
            if (this.debug) {
                console.log('OpenLayersMap: loader: extend =', extend, ', resolution (deg/pix) =', resolution, ', projection =', projection);
            }
        }

        function strategy(extend: ol.Extent, resolution: number): ol.Extent[] {
            if (this.debug) {
                console.log('OpenLayersMap: strategy: extend =', extend, ', resolution (deg/pix) =', resolution);
            }
            // [minx, miny, maxx, maxy]
            const minx = extend[0];
            const miny = extend[1];
            const maxx = extend[2];
            const maxy = extend[3];
            const dx = maxx - minx;
            const dy = maxy - miny;
            // quad-tree tiling:
            return [
                [minx, miny, minx + 0.5 * dx, miny + 0.5 * dy],
                [minx, miny + 0.5 * dy, minx + 0.5 * dx, miny + dy],
                [minx + 0.5 * dx, miny, minx + dx, miny + 0.5 * dy],
                [minx + 0.5 * dx, miny + 0.5 * dy, minx + dx, miny + dy],
            ];
        }

        return new ol.layer.Vector({
            source: new ol.source.Vector({loader, strategy}),
        });
    }
}


