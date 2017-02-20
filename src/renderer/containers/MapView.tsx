import * as React from 'react';
import {LayerState, State, WorkspaceState, VariableImageLayerState} from "../state";
import {OpenLayersMap, LayerDescriptor} from "../components/openlayers/OpenLayersMap";
import {connect} from "react-redux";
import {getTileUrl} from "../actions";
import * as ol from 'openlayers'

interface IMapViewProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    layers: LayerState[];
}

function mapStateToProps(state: State): IMapViewProps {
    return {
        baseUrl: state.data.appConfig.webAPIConfig.restUrl,
        workspace: state.data.workspace,
        offlineMode: state.session.offlineMode,
        layers: state.data.layers,
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class MapView extends React.Component<IMapViewProps, null> {

    render() {
        const mapLayers = [];
        if (this.props.workspace && this.props.workspace.resources && this.props.layers) {
            for (let layer of this.props.layers) {
                let mapLayer;
                switch (layer.type) {
                    case 'VariableImage':
                        mapLayer = this.convertVariableImageLayerToMapLayer(layer as VariableImageLayerState);
                }
                if (mapLayer) {
                    mapLayers.push(mapLayer);
                } else {
                    console.warn(`MapView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <div style={{width:"100%", height:"100%"}}>
                <OpenLayersMap id="defaultMapView"
                               debug={true}
                               layers={mapLayers}
                               offlineMode={this.props.offlineMode}
                               style={{width:"100%", height:"100%"}}/>
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }

    private convertVariableImageLayerToMapLayer(layer: VariableImageLayerState): LayerDescriptor|null {
        const resource = this.props.workspace.resources.find(r => r.name === layer.resName);
        if (resource) {
            const variable = resource.variables.find(v => v.name === layer.varName);
            if (variable) {
                const imageLayout = variable.imageLayout;
                if (variable.imageLayout) {
                    const baseDir = this.props.workspace.baseDir;
                    const url = getTileUrl(this.props.baseUrl, baseDir, layer);
                    let extent: ol.Extent = [-180, -90, 180, 90];
                    if (imageLayout.sector) {
                        const sector = imageLayout.sector;
                        extent = [sector.west, sector.south, sector.east, sector.north];
                    }
                    const startResolution = 360. / (imageLayout.numLevelZeroTilesX * imageLayout.tileWidth);
                    const resolutions = new Array<number>(imageLayout.numLevels);
                    for (let i = 0; i < resolutions.length; i++) {
                        resolutions[i] = startResolution / Math.pow(2, i);
                    }
                    const origin: ol.Coordinate = [-180, 90];
                    const tileSize: [number, number] = [imageLayout.tileWidth, imageLayout.tileHeight];
                    // see https://openlayers.org/en/latest/apidoc/ol.source.XYZ.html
                    return {
                        id: layer.id,
                        name: layer.name,
                        visible: layer.show,
                        opacity: layer.imageEnhancement.alpha,
                        layerSource: MapView.createXYZSource,
                        layerSourceOptions: {
                            url,
                            projection: ol.proj.get('EPSG:4326'),
                            minZoom: 0,
                            maxZoom: imageLayout.numLevels - 1,
                            tileGrid: new ol.tilegrid.TileGrid({
                                extent,
                                origin,
                                resolutions,
                                tileSize,
                            }),
                        },
                    };
                } else {
                    console.warn(`MapView: variable "${layer.varName}" of resource "${layer.resName}" has no imageLayout`);
                }
            } else {
                console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            }
        } else {
            console.warn(`MapView: resource "${layer.resName}" not found`);
        }
        return null;
    }

    /**
     * Creates a Cesium.UrlTemplateImageryProvider instance.
     *
     * @param tileSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
     * @returns {ol.source.XYZ}
     */
    private static createXYZSource(tileSourceOptions: olx.source.XYZOptions): ol.source.XYZ {
        const tileSource = new ol.source.XYZ(tileSourceOptions);
        tileSource.on("loaderror", (event) => {
            console.error('MapView:', event);
        }, this);
        return tileSource;
    }
}

export default connect(mapStateToProps)(MapView);
