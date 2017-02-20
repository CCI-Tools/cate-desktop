import * as React from 'react';
import * as ol from 'openlayers'
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../Layer";


type OpenLayersObject = {
    container: HTMLElement;
    map: ol.Map;
}

/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name: string;
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
    name: string;
    visible: boolean;
    opacity?: number;
    layerSource: (options: any) => ol.source.Tile | ol.source.Tile;
    layerSourceOptions: any;
}

export interface IOpenLayersMapProps extends IPermanentComponentProps {
    offlineMode?: boolean;
    pins?: PinDescriptor[];
    layers?: LayerDescriptor[];
}


/**
 * A component that wraps an OpenLayers 4.0 2D Map.
 *
 * @author Norman Fomferra
 */
export class OpenLayersMap extends PermanentComponent<OpenLayersObject, IOpenLayersMapProps,any> {

    private lastLayers: LayerDescriptor[];

    constructor(props) {
        super(props);
        this.lastLayers = null;
    }

    get map(): ol.Map {
        return this.permanentObject.map;
    }

    createPermanentObject(parentContainer: HTMLElement): OpenLayersObject {
        const divElement = this.createContainer();
        const options = {
            target: divElement,
            layers: [
                new ol.layer.Tile({
                    // source: new ol.source.OSM()
                    // source: new ol.source.CartoDB({}),
                    source: new ol.source.BingMaps({
                        key: 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci',
                        imagerySet: "Aerial",
                        reprojectionErrorThreshold: 2.5,
                    }),
                })
            ],
            view: new ol.View({
                projection: 'EPSG:4326',
                center: [0, 0],
                zoom: 4,
            })
        };
        return {
            container: divElement,
            map: new ol.Map(options)
        };
    }

    permanentObjectMounted(permanentObject: OpenLayersObject): void {
        permanentObject.map.updateSize();
        this.updateMapLayers(this.lastLayers || [], this.props.layers || []);
    }

    permanentObjectUnmounted(permanentObject: OpenLayersObject): void {
        this.lastLayers = this.props.layers;
    }

    componentWillReceiveProps(nextProps: IOpenLayersMapProps) {
        this.updateMapLayers(this.props.layers || [], nextProps.layers || []);
    }

    private updateMapLayers(currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        if (this.props.debug) {
            console.log('OpenLayersMap: updating map layers');
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
                    OpenLayersMap.setLayerProps(olLayer, action.newLayer);
                    break;
                case 'REMOVE':
                    this.removeLayer(olIndex);
                    break;
                case 'UPDATE':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Tile;
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.layerSourceOptions.url !== newLayer.layerSourceOptions.url) {
                        if (oldLayer.name === newLayer.name) {
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
                    this.map.getLayers().removeAt(olIndex);
                    this.map.getLayers().insertAt(olIndex - action.numSteps, olLayer);
                    break;
                default:
                    console.error(`OpenLayersMap: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private static getLayerSource(layerDescriptor: LayerDescriptor) {
        if (typeof layerDescriptor.layerSource === 'function') {
            return layerDescriptor.layerSource(layerDescriptor.layerSourceOptions);
        } else {
            return layerDescriptor.layerSource;
        }
    }

    private addLayer(layerDescriptor: LayerDescriptor, layerIndex: number): ol.layer.Tile {
        const layerSource = OpenLayersMap.getLayerSource(layerDescriptor);
        // see https://openlayers.org/en/latest/apidoc/ol.layer.Tile.html
        const olLayer = new ol.layer.Tile({source: layerSource});
        this.map.getLayers().insertAt(layerIndex, olLayer);
        if (this.props.debug) {
            console.log(`OpenLayersMap: added tile layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return olLayer;
    }

    private removeLayer(layerIndex: number): void {
        this.map.getLayers().removeAt(layerIndex);
        if (this.props.debug) {
            console.log(`OpenLayersMap: removed tile layer #${layerIndex}`);
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
}
