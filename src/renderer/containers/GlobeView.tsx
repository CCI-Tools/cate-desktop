import * as React from 'react';
import {
    LayerState, State, WorkspaceState, VariableImageLayerState, VariableVectorLayerState,
    VariableState, VariableRefState
} from "../state";
import {
    CesiumGlobe, LayerDescriptor, ImageryProvider, DataSourceDescriptor,
    DataSource
} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";
import * as actions from "../actions";
const Cesium: any = require('cesium');

interface IGlobeViewProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    layers: LayerState[];
}

function mapStateToProps(state: State): IGlobeViewProps {
    return {
        baseUrl: state.data.appConfig.webAPIConfig.restUrl,
        workspace: state.data.workspace,
        offlineMode: state.session.offlineMode,
        layers: state.data.layers,
    };
}

/**
 * This component displays a 3D globe with a number of layers.
 */
class GlobeView extends React.Component<IGlobeViewProps, null> {

    render() {
        const layers = [];
        const dataSources = [];
        if (this.props.workspace && this.props.workspace.resources && this.props.layers) {
            for (let layer of this.props.layers) {
                switch (layer.type) {
                    case 'VariableImage': {
                        const layerDescriptor = this.convertVariableImageLayerToLayerDescriptor(layer as VariableImageLayerState);
                        layers.push(layerDescriptor);
                        break;
                    }
                    case 'VariableVector': {
                        const dataSourceDescriptor = this.convertVariableVectorLayerToDataSourceDescriptor(layer as VariableVectorLayerState);
                        dataSources.push(dataSourceDescriptor);
                        break;
                    }
                    default:
                        console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumGlobe id="defaultGlobeView"
                             debug={true}
                             layers={layers}
                             dataSources={dataSources}
                             offlineMode={this.props.offlineMode}
                             style={{width:"100%", height:"100%"}}/>
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }

    private getVariable(ref: VariableRefState): VariableState {
        return actions.findVariable(this.props.workspace.resources, ref);
    }

    private convertVariableImageLayerToLayerDescriptor(layer: VariableImageLayerState): LayerDescriptor|null {
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            return null;
        }
        const imageLayout = variable.imageLayout;
        if (!variable.imageLayout) {
            console.warn(`MapView: variable "${layer.varName}" of resource "${layer.resName}" has no imageLayout`);
            return null;
        }
        const baseDir = this.props.workspace.baseDir;
        const url = actions.getTileUrl(this.props.baseUrl, baseDir, layer);
        let rectangle = Cesium.Rectangle.MAX_VALUE;
        if (imageLayout.sector) {
            const sector = imageLayout.sector;
            rectangle = Cesium.Rectangle.fromDegrees(sector.west, sector.south, sector.east, sector.north);
        }
        return Object.assign({}, layer, {
            imageryProvider: GlobeView.createImageryProvider,
            imageryProviderOptions: {
                url,
                rectangle,
                minimumLevel: 0,
                maximumLevel: imageLayout.numLevels - 1,
                tileWidth: imageLayout.tileWidth,
                tileHeight: imageLayout.tileHeight,
                tilingScheme: new Cesium.GeographicTilingScheme({
                    rectangle,
                    numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                    numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
                }),
            },
        });
    }

    private convertVariableVectorLayerToDataSourceDescriptor(layer: VariableVectorLayerState): DataSourceDescriptor|null {
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`MapView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            return null;
        }
        const baseDir = this.props.workspace.baseDir;
        const url = actions.getGeoJSONUrl(this.props.baseUrl, baseDir, layer);
        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            dataSource: GlobeView.createGeoJsonDataSource,
            dataSourceOptions: {url},
        };
    }

    /**
     * Creates a Cesium.UrlTemplateImageryProvider instance.
     *
     * @param imageryProviderOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
     */
    private static createImageryProvider(imageryProviderOptions): ImageryProvider {
        const imageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
        imageryProvider.errorEvent.addEventListener((event) => {
            console.error('GlobeView:', event);
        });
        return imageryProvider;
    }

    /**
     * Creates a Cesium.GeoJsonDataSource instance.
     *
     * @param dataSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
     */
    private static createGeoJsonDataSource(dataSourceOptions): DataSource {
        return Cesium.GeoJsonDataSource.load(dataSourceOptions.url, {
            stroke: Cesium.Color.HOTPINK,
            fill: Cesium.Color.PINK,
            strokeWidth: 3,
            markerSymbol: '?'
        });
    }

}

export default connect(mapStateToProps)(GlobeView);
