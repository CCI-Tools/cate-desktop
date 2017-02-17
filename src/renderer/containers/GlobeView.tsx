import * as React from 'react';
import {LayerState, State, WorkspaceState, VariableImageLayerState} from "../state";
import {CesiumGlobe, ImageLayerDescriptor, ImageryProvider} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";
const Cesium: any = require('cesium');

interface IGlobeViewProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    layers: LayerState[];
}

function mapStateToProps(state: State): IGlobeViewProps {
    return {
        workspace: state.data.workspace,
        offlineMode: state.session.offlineMode,
        layers: state.data.layers,
        baseUrl: state.data.appConfig.webAPIConfig.restUrl,
    };
}


/**
 * An example of CesiumGlobe that displays some pins.
 */
export class GlobeView extends React.Component<IGlobeViewProps, null> {

    render() {
        const cesiumImageLayers = [];
        if (this.props.workspace && this.props.workspace.resources && this.props.layers) {
            for (let layer of this.props.layers) {
                let cesiumImageLayer;
                switch (layer.type) {
                    case 'VariableImage':
                        cesiumImageLayer = this.convertVariableImageLayerToCesiumImageLayer(layer as VariableImageLayerState);
                }
                if (cesiumImageLayer) {
                    cesiumImageLayers.push(cesiumImageLayer);
                } else {
                    console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumGlobe id="defaultGlobeView"
                             debug={true}
                             imageLayers={cesiumImageLayers}
                             offlineMode={this.props.offlineMode}
                             style={{width:"100%", height:"100%"}}/>
                {/*<CesiumCityList pins={this.state.pins} onChange={this.handleCheckboxChange.bind(this)}/>*/}
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }

    private convertVariableImageLayerToCesiumImageLayer(layer: VariableImageLayerState): ImageLayerDescriptor|null {
        const resource = this.props.workspace.resources.find(r => r.name === layer.resName);
        if (resource) {
            const variable = resource.variables.find(v => v.name === layer.varName);
            if (variable) {
                const imageLayout = variable.imageLayout;
                if (variable.imageLayout) {
                    const baseDir = this.props.workspace.baseDir;
                    const url = this.createVariableImageryProviderUrl(baseDir, layer);
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

    private createVariableImageryProviderUrl(baseDir: string, layer: VariableImageLayerState): string {
        return this.props.baseUrl + `ws/res/tile/${encodeURIComponent(baseDir)}/${encodeURIComponent(layer.resName)}/{z}/{y}/{x}.png?`
            + `&var=${encodeURIComponent(layer.varName)}`
            + `&index=${encodeURIComponent((layer.varIndex || []).join())}`
            + `&cmap=${encodeURIComponent(layer.colorMapName) + (layer.alphaBlending ? '_alpha' : '')}`
            + `&min=${encodeURIComponent(layer.displayMin + '')}`
            + `&max=${encodeURIComponent(layer.displayMax + '')}`;
    }

    /**
     * Creates a Cesium.UrlTemplateImageryProvider instance.
     *
     * @param imageryProviderOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
     * @returns {Cesium.UrlTemplateImageryProvider}
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
