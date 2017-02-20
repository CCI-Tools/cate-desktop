import * as React from 'react';
import {LayerState, State, WorkspaceState, VariableImageLayerState} from "../state";
import {CesiumGlobe, LayerDescriptor, ImageryProvider} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";
import {getTileUrl} from "../actions";
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
        const globeLayers = [];
        if (this.props.workspace && this.props.workspace.resources && this.props.layers) {
            for (let layer of this.props.layers) {
                let globeLayer;
                switch (layer.type) {
                    case 'VariableImage':
                        globeLayer = this.convertVariableImageLayerToGlobeLayer(layer as VariableImageLayerState);
                }
                if (globeLayer) {
                    globeLayers.push(globeLayer);
                } else {
                    console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumGlobe id="defaultGlobeView"
                             debug={true}
                             layers={globeLayers}
                             offlineMode={this.props.offlineMode}
                             style={{width:"100%", height:"100%"}}/>
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }

    private convertVariableImageLayerToGlobeLayer(layer: VariableImageLayerState): LayerDescriptor|null {
        const resource = this.props.workspace.resources.find(r => r.name === layer.resName);
        if (resource) {
            const variable = resource.variables.find(v => v.name === layer.varName);
            if (variable) {
                const imageLayout = variable.imageLayout;
                if (variable.imageLayout) {
                    const baseDir = this.props.workspace.baseDir;
                    const url = getTileUrl(this.props.baseUrl, baseDir, layer);
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
                } else {
                    console.warn(`GlobeView: variable "${layer.varName}" of resource "${layer.resName}" has no imageLayout`);
                }
            } else {
                console.warn(`GlobeView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            }
        } else {
            console.warn(`GlobeView: resource "${layer.resName}" not found`);
        }
        return null;
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
}

export default connect(mapStateToProps)(GlobeView);
