import * as React from 'react';
import {
    State, WorkspaceState, VariableImageLayerState,
    VariableRefState, VariableState, ResourceState, VectorLayerState, WorldViewDataState, ResourceVectorLayerState,
    ResourceRefState
} from "../state";
import {OpenLayersMap, LayerDescriptor} from "../components/openlayers/OpenLayersMap";
import {connect, DispatchProp} from "react-redux";
import * as ol from 'openlayers';
import {
    findVariable, findResource, getFeatureCollectionUrl, getTileUrl, getGeoJSONCountriesUrl,
    COUNTRIES_LAYER_ID, SELECTED_VARIABLE_LAYER_ID
} from "../state-util";
import {ViewState} from "../components/ViewState";
import * as selectors from "../selectors";

interface IMapViewOwnProps {
    view: ViewState<WorldViewDataState>;
}

interface IMapViewProps extends IMapViewOwnProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
}

function mapStateToProps(state: State, ownProps: IMapViewOwnProps): IMapViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        workspace: selectors.workspaceSelector(state),
        offlineMode: state.session.offlineMode,
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class MapView extends React.Component<IMapViewProps & DispatchProp<State>, null> {

    render() {
        const mapLayers = [];
        if (this.props.workspace && this.props.workspace.resources && this.props.view.data.layers) {
            for (let layer of this.props.view.data.layers) {
                let mapLayer;
                switch (layer.type) {
                    case 'VariableImage':
                        mapLayer = this.convertVariableImageLayerToMapLayer(layer as VariableImageLayerState);
                        break;
                    case 'ResourceVector':
                        mapLayer = this.convertResourceVectorLayerToMapLayer(layer as ResourceVectorLayerState);
                        break;
                    case 'Vector':
                        mapLayer = this.convertVectorLayerToMapLayer(layer as VectorLayerState);
                        break;
                }
                if (mapLayer) {
                    mapLayers.push(mapLayer);
                } else if (layer.id !== SELECTED_VARIABLE_LAYER_ID) {
                    console.warn(`MapView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <OpenLayersMap id={'OpenLayersMap-' + this.props.view.id}
                           debug={false}
                           projectionCode={this.props.view.data.projectionCode}
                           layers={mapLayers}
                           offlineMode={this.props.offlineMode}
                           style={{width: "100%", height: "100%"}}/>
        );
    }

    private getResource(ref: ResourceRefState): ResourceState {
        return findResource(this.props.workspace.resources, ref);
    }

    private getVariable(ref: VariableRefState): VariableState {
        return findVariable(this.props.workspace.resources, ref);
    }

    private convertVariableImageLayerToMapLayer(layer: VariableImageLayerState): LayerDescriptor | null {
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resId}"`);
            return null;
        }
        const imageLayout = variable.imageLayout;
        if (!variable.imageLayout) {
            console.warn(`MapView: variable "${layer.varName}" of resource "${layer.resId}" has no imageLayout`);
            return null;
        }
        const baseDir = this.props.workspace.baseDir;
        const url = getTileUrl(this.props.baseUrl, baseDir, layer);
        let extent: ol.Extent = [-180, -90, 180, 90];
        if (imageLayout.extent) {
            extent = [
                imageLayout.extent.west,
                imageLayout.extent.south,
                imageLayout.extent.east,
                imageLayout.extent.north
            ];
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
            visible: layer.visible,
            opacity: layer.opacity,
            layerFactory: createTileLayer,
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
    }

    private convertResourceVectorLayerToMapLayer(layer: ResourceVectorLayerState): LayerDescriptor | null {
        const baseDir = this.props.workspace.baseDir;
        const url = getFeatureCollectionUrl(this.props.baseUrl, baseDir, layer);

        const streamFeatures = function (extend: ol.Extent, resolution: number, projection: ol.proj.Projection) {
            const source = (this as any) as ol.source.Vector;
            console.log('streamFeatures #1:', source, extend, resolution, projection);

            const geoJSONFormat = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:4326',
                featureProjection: projection
            });

            let numFeatures = 0;

            const worker = new Worker("common/stream-geojson.js");
            worker.postMessage(url);
            worker.onmessage = function (event: MessageEvent) {
                const geoJsonFeatures = event.data;
                if (!geoJsonFeatures) {
                    console.log(`${numFeatures} feature(s) received from ${url}`);
                    return;
                }
                const features = geoJSONFormat.readFeatures({type: 'FeatureCollection', features: geoJsonFeatures});
                source.addFeatures(features);
                numFeatures += features.length;
            };

            console.log('streamFeatures #2:', source, extend, resolution, projection);
        };

        const layerSourceOptions = {
            loader: streamFeatures,
        };

        const layerFactory = (layerSourceOptions) => {
            return new ol.layer.Vector({
                source: new ol.source.Vector(layerSourceOptions)
            });
        };

        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            layerFactory,
            layerSourceOptions,
        };
    }

    private convertVectorLayerToMapLayer(layer: VectorLayerState): LayerDescriptor | null {
        let url = layer.data;
        if (layer.id === COUNTRIES_LAYER_ID) {
            url = getGeoJSONCountriesUrl(this.props.baseUrl);
        }
        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            layerFactory: createGeoJSONLayer,
            layerSourceOptions: {url},
        };
    }
}

export default connect(mapStateToProps)(MapView);


function createTileLayer(sourceOptions: olx.source.XYZOptions) {
    const tileSource = new ol.source.XYZ(sourceOptions);
    tileSource.on("loaderror", (event) => {
        console.error('MapView:', event);
    }, this);
    // see https://openlayers.org/en/latest/apidoc/ol.layer.Tile.html
    return new ol.layer.Tile({source: tileSource});
}

function createGeoJSONLayer(sourceOptions: olx.source.VectorOptions) {
    // See also http://openlayers.org/en/master/examples/geojson.html
    const vectorSource = new ol.source.Vector(Object.assign({}, sourceOptions, {
        format: new ol.format.GeoJSON({
            defaultDataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:4326'
        })
    }));
    return new ol.layer.Vector({source: vectorSource});
}

function styleFunction(feature: ol.Feature) {
    //noinspection UnnecessaryLocalVariableJS
    let undef;
    return undef;
}

