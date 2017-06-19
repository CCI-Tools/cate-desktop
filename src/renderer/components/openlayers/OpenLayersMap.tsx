import * as React from 'react';
import * as ol from 'openlayers';
import * as proj4 from 'proj4';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {arrayDiff} from "../../../common/array-diff";

ol.proj.setProj4(proj4);


/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name?: string | null;
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
    name?: string | null;
    visible: boolean;
    opacity?: number;
    layerFactory: (layerSourceOptions: any) => ol.layer.Layer;
    layerSourceOptions: any;
}

export interface IOpenLayersMapProps extends IExternalObjectComponentProps<ol.Map, OpenLayersState>, OpenLayersState {
    offlineMode?: boolean;
    projectionCode?: string;
    onMapMounted?: (id: string, map: ol.Map) => void;
    onMapUnmounted?: (id: string, map: ol.Map) => void;
}

interface OpenLayersState {
    pins?: PinDescriptor[];
    layers?: LayerDescriptor[];
}

const EMPTY_ARRAY = [];

/**
 * A component that wraps an OpenLayers 4.0 2D Map.
 *
 * @author Norman Fomferra
 */
export class OpenLayersMap extends ExternalObjectComponent<ol.Map, OpenLayersState, IOpenLayersMapProps, any> {

    constructor(props) {
        super(props);
    }

    newContainer(id: string): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "olmap-container-" + id);
        div.setAttribute("style", "width: 100%; height: 100%; overflow: hidden;");
        return div;
    }

    newExternalObject(parentContainer: HTMLElement, container: HTMLElement): ol.Map {
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

            }),
            controls: ol.control.defaults({
                zoom: false,
                attribution: false,
                rotate: false
            })
        };
        //noinspection UnnecessaryLocalVariableJS
        const map = new ol.Map(options);
        //map.addControl(new ol.control.ZoomSlider());
        //map.addControl(new ol.control.ScaleLine());
        //map.addControl(new ol.control.OverviewMap());
        //map.addControl(new ol.control.MousePosition());
        //map.addControl(new ol.control.Attribution());
        //map.addControl(new ol.control.Zoom());

        return map;
    }

    updateExternalObject(map: ol.Map, prevState: OpenLayersState, nextState: OpenLayersState): void {
        const prevLayers = (prevState && prevState.layers) || EMPTY_ARRAY;
        const nextLayers = nextState.layers || EMPTY_ARRAY;
        if (prevLayers !== nextLayers) {
            this.updateMapLayers(map, prevLayers, nextLayers);
        }
    }

    componentWillUpdate(nextProps: IOpenLayersMapProps & OpenLayersState): any {
        if (this.props.projectionCode !== nextProps.projectionCode) {
            this.forceRegeneration();
        }
        return super.componentWillUpdate(nextProps);
    }

    externalObjectMounted(map: ol.Map): void {
        map.updateSize();
        if (this.props.onMapMounted) {
            this.props.onMapMounted(this.props.id, map);
        }
    }

    externalObjectUnmounted(map: ol.Map): void {
        if (this.props.onMapUnmounted) {
            this.props.onMapUnmounted(this.props.id, map);
        }
    }

    private updateMapLayers(map: ol.Map, currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        if (this.props.debug) {
            console.log('OpenLayersMap: updating layers');
        }
        const actions = arrayDiff<LayerDescriptor>(currentLayers, nextLayers);
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
                    olLayer = this.addLayer(map, action.newElement, olIndex);
                    // TODO (forman): FIXME! Keep assertion here and below, but they currently fail.
                    //                Possible reason, new map views may not have their
                    //                'selectedVariable' layer correctly initialized. Same problem in CesiumGlobe!
                    //assert.ok(olLayer);
                    if (!olLayer) {
                        console.error('OpenLayersMap: no olLayer at index ' + olIndex);
                        break;
                    }
                    OpenLayersMap.setLayerProps(olLayer, action.newElement);
                    break;
                case 'REMOVE':
                    olLayer = map.getLayers().item(olIndex) as ol.layer.Tile;
                    //assert.ok(olLayer);
                    if (!olLayer) {
                        console.error('OpenLayersMap: no olLayer at index ' + olIndex);
                        break;
                    }
                    this.removeLayer(map, olIndex);
                    break;
                case 'UPDATE':
                    olLayer = map.getLayers().item(olIndex) as ol.layer.Tile;
                    //assert.ok(olLayer);
                    if (!olLayer) {
                        console.error('OpenLayersMap: no olLayer at index ' + olIndex);
                        break;
                    }
                    oldLayer = action.oldElement;
                    newLayer = action.newElement;
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
                            this.removeLayer(map, olIndex);
                            olLayer = this.addLayer(map, newLayer, olIndex);
                        }
                    }
                    OpenLayersMap.setLayerProps(olLayer, action.newElement, action.oldElement);
                    break;
                case 'MOVE':
                    olLayer = map.getLayers().item(olIndex) as ol.layer.Layer;
                    //assert.ok(olLayer);
                    if (!olLayer) {
                        console.error('OpenLayersMap: no olLayer at index ' + olIndex);
                        break;
                    }
                    map.getLayers().removeAt(olIndex);
                    map.getLayers().insertAt(olIndex + action.numSteps, olLayer);
                    break;
                default:
                    console.error(`OpenLayersMap: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private addLayer(map: ol.Map, layerDescriptor: LayerDescriptor, layerIndex: number): ol.layer.Layer {
        const olLayer = layerDescriptor.layerFactory(layerDescriptor.layerSourceOptions);
        map.getLayers().insertAt(layerIndex, olLayer);
        if (this.props.debug) {
            console.log(`OpenLayersMap: added layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return olLayer;
    }

    private removeLayer(map: ol.Map, layerIndex: number): void {
        map.getLayers().removeAt(layerIndex);
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


