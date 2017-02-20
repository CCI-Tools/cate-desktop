import * as React from 'react';
import * as ol from 'openlayers'
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../Layer";


type OpenLayersObject = {
    container: HTMLElement;
    map: ol.Map;
}

/**
 * Describes an image layer to be displayed on the Cesium globe.
 */
export interface LayerDescriptor {
    id: string;
    name: string;
    visible: boolean;
    opacity?: number;
    layerSource: (options: any) => ol.source.Tile | ol.source.Tile;
    layerSourceOptions?: ol.SourceTileOptions;
}

export interface IOpenLayersMapProps extends IPermanentComponentProps {
    layers?: LayerDescriptor[];
}


/**
 * A component that wraps an OpenLayers 3.0 2D Map.
 *
 * @author Norman Fomferra
 */
export class OpenLayersMap extends PermanentComponent<OpenLayersObject, IOpenLayersMapProps,any> {

    constructor(props) {
        super(props)
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
                        imagerySet: "Aerial"
                    }),
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([37.41, 8.82]),
                zoom: 4
            })
        };
        return {
            container: divElement,
            map: new ol.Map(options)
        };
    }

    permanentObjectMounted(permanentObject: OpenLayersObject): void {
        permanentObject.map.updateSize();
    }

    componentWillReceiveProps(nextProps: IOpenLayersMapProps) {
        const currentLayers = this.props.layers || [];
        const nextLayers = nextProps.layers || [];

        const actions = getLayerDiff<LayerDescriptor>(currentLayers, nextLayers);
        let olLayer: ol.layer.Layer;
        let newLayer: LayerDescriptor;
        let oldLayer: LayerDescriptor;
        let oldLayerSource: ol.source.UrlTile;
        let newLayerSource: ol.source.UrlTile;
        for (let action of actions) {
            // olIndex is +1 because of its base layer at olIndex=0
            const olIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    this.addLayer(action.newLayer, olIndex);
                    break;
                case 'REMOVE':
                    this.removeLayer(olIndex);
                    break;
                case 'UPDATE':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Tile;
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    oldLayerSource = newLayerSource = null;
                    if (oldLayer.layerSource instanceof ol.source.UrlTile) {
                        oldLayerSource = (oldLayer.layerSource as any) as ol.source.UrlTile;
                    }
                    if (newLayer.layerSource instanceof ol.source.UrlTile) {
                        newLayerSource = (newLayer.layerSource as any) as ol.source.UrlTile;
                    }
                    if (oldLayerSource && newLayerSource &&
                        (oldLayerSource.getUrls()[0] !== newLayerSource.getUrls()[0])) {
                        if (oldLayer.name === newLayer.name) {
                            // Reusable source: See http://openlayers.org/en/latest/examples/reusable-source.html?q=url
                            oldLayerSource.setUrl(newLayerSource.getUrls()[0]);
                        } else {
                            // Replace layer
                            this.removeLayer(olIndex);
                            olLayer = this.addLayer(newLayer, olIndex);
                        }
                    }
                    if (oldLayer.visible !== newLayer.visible) {
                        olLayer.setVisible(newLayer.visible);
                    }
                    if (oldLayer.opacity !== newLayer.opacity) {
                        olLayer.setOpacity(newLayer.opacity);
                    }
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

    private static getLayerSource(layerDescriptor: LayerDescriptor): ol.source.Tile {
        if (typeof layerDescriptor.layerSource === 'function') {
            return layerDescriptor.layerSource(layerDescriptor.layerSourceOptions);
        } else {
            return layerDescriptor.layerSource;
        }
    }

    private addLayer(layerDescriptor: LayerDescriptor, layerIndex: number): ol.layer.Tile {
        const layerSource = OpenLayersMap.getLayerSource(layerDescriptor);
        const olLayer = new ol.layer.Tile({source: layerSource});
        this.map.getLayers().insertAt(layerIndex, olLayer);
        console.log(`OpenLayersMap: added tile layer #${layerIndex}: ${layerDescriptor.name}`);
        return olLayer;
    }

    private removeLayer(layerIndex: number): void {
        this.map.getLayers().removeAt(layerIndex);
        console.log(`OpenLayersMap: removed tile layer #${layerIndex}`);
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "ol-container-" + this.props.id);
        div.setAttribute("class", "ol-container");
        return div;
    }
}
