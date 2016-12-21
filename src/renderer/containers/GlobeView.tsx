import * as React from 'react';
import {LayerState, State, WorkspaceState} from "../state";
import {CesiumGlobe} from "../components/cesium/CesiumGlobe";
import {connect} from "react-redux";

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

    render() {
        // todo: transform this.props.layers --> imageLayers
        const imageLayers = [];

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
