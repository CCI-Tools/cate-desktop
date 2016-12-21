import * as React from 'react';
import {LayerState, State, WorkspaceState, VariableImageLayerState} from "../state";
import {CesiumGlobe} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";
const Cesium: any = require('cesium');

interface IGlobeViewProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    layers: Array<LayerState>;
}

function mapStateToProps(state: State): IGlobeViewProps {
    return {
        workspace: state.data.workspace,
        layers: state.data.layers,
        baseUrl: state.data.appConfig.webAPIConfig.restUrl,
    };
}


/**
 * An example of CesiumGlobe that displays some pins.
 */
export class GlobeView extends React.Component<IGlobeViewProps, null> {

    private createImageryProviderUrl(baseDir : string, layerState : VariableImageLayerState) : string {
        return this.props.baseUrl + `ws/res/tile/${encodeURIComponent(baseDir)}/${encodeURIComponent(layerState.resName)}/{z}/{y}/{x}.png?`
            + `&var=${encodeURIComponent(layerState.varName)}`
            + `&cmap=${encodeURIComponent(layerState.colorMapName) + (layerState.displayAlpha ? '_alpha' : '')}`
            + `&min=${encodeURIComponent(layerState.displayMin + '')}`
            + `&max=${encodeURIComponent(layerState.displayMax + '')}`;
    }

    private static imageryProvider(imageryProviderOptions) {
        const imageryProviderUrl = imageryProviderOptions.url;
        const imageLayout = imageryProviderOptions.imageLayout;
        // see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: imageryProviderUrl,
            // # todo - use imageConfig.sector to specify 'rectangle' option. See backend todo.
            // rectangle: imageLayout.sector,
            minimumLevel: 0,
            maximumLevel: imageLayout.numLevels - 1,
            tileWidth: imageLayout.tileWidth,
            tileHeight: imageLayout.tileHeight,
            tilingScheme: new Cesium.GeographicTilingScheme({
                numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
            })
        });
        return imageryProvider;
    }

    render() {
        // todo: transform this.props.layers --> imageLayers
        const imageLayers = [];
        for (let i = 0; i < this.props.layers.length; i++) {
            const layer = this.props.layers[i];
            // if (layer instanceof VariableImageLayerState) { // TODO (mz) how to check this ???
            const baseDir = this.props.workspace.baseDir;
            const varImgLayerState = layer as VariableImageLayerState;
            const url = this.createImageryProviderUrl(baseDir, varImgLayerState);
            const resource = this.props.workspace.resources.find(r => r.name === varImgLayerState.resName);
            if (resource) {
                const imageLayout = resource.variables.find(v => v.name === varImgLayerState.varName);
                if (imageLayout) {
                    imageLayers.push({
                        id: layer.id,
                        name: layer.name,
                        visible: layer.show,
                        imageryProvider: GlobeView.imageryProvider,
                        imageryProviderOptions: {
                            url: url,
                            imageLayout: imageLayout
                        }
                    });
                }
            }
        }

        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumGlobe id="defaultGlobeView"
                             debug={true}
                             imageLayers={imageLayers}
                             offlineMode={false}
                             style={{width:"100%", height:"100%"}}/>
                {/*<CesiumCityList pins={this.state.pins} onChange={this.handleCheckboxChange.bind(this)}/>*/}
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(GlobeView);
