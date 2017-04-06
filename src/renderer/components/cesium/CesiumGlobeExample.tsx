import * as React from 'react';
import {CesiumGlobe, PinDescriptor} from './CesiumGlobe';

// TODO (forman): this is an example file only, remove CesiumGlobeExample.tsx asap
const {app} = require('electron').remote;

interface ICesiumViewProps {
    id: string;
}

interface ICesiumViewState {
    pins: Array<PinDescriptor>;
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
            <CesiumGlobe id={this.props.id}
                         debug={true}
                         offlineMode={false}
                         style={{width:"100%", height:"100%"}}
                         pins={this.state.pins}/>
        );
    }
}
