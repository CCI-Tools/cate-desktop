import * as React from 'react';
import {CesiumGlobe, CesiumPin} from './CesiumGlobe';

// TODO: only used to get electron.app.getAppPath
const {app} = require('electron').remote;

interface ICesiumViewProps {
    id: string;
}

interface ICesiumViewState {
    pins: Array<CesiumPin>;
}

/**
 * An example of CesiumGlobe that displays some pins.
 */
export class CesiumGlobeExample extends React.Component<ICesiumViewProps, ICesiumViewState> {
    constructor(props: ICesiumViewProps) {
        super(props);

        const pinIcon = app.getAppPath() + '/resources/images/pin.svg';
        const pins = require(app.getAppPath() + '/resources/data/top10cities.json');
        const pinsWithIcon = pins.map(pin => Object.assign(pin, {image: pinIcon}));

        this.state = {pins: pinsWithIcon};
    }

    render() {
        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumGlobe id={this.props.id}
                             debug={true}
                             offlineMode={false}
                             style={{width:"100%", height:"100%"}}
                             pins={this.state.pins}/>
                {/*<CesiumCityList pins={this.state.pins} onChange={this.handleCheckboxChange.bind(this)}/>*/}
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }
}
