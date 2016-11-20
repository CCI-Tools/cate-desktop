import * as React from 'react';
import {CesiumComponent} from './cesium';
import {ICity, CesiumCityList} from './cities';

// TODO: only used to get electron.app.getAppPath
const {app} = require('electron').remote;

interface ICesiumViewState {
    cities: Array<ICity>;
}

export class CesiumView extends React.Component<any, ICesiumViewState> {
    constructor (props) {
        super(props);
        //noinspection JSFileReferences
        this.state = {
            cities: require(app.getAppPath() + '/resources/data/top10cities.json')
        };
    }

    private handleCheckboxChange(event) {
        let cities = this.state.cities;
        let newCities = cities.map((city) => {
            let visible = (city.id === event.target.value) ? event.target.checked : city.visible;
            return {
                id: city.id,
                name: city.name,
                state: city.state,
                latitude: city.latitude,
                longitude: city.longitude,
                visible: visible
            }
        });
        this.setState({
            cities: newCities
        })
    }

    render() {
        return (
            <div style={{width:"100%", height:"100%"}}>
                <CesiumComponent id="cesium5" cities={this.state.cities}/>
                {/*<CesiumCityList cities={this.state.cities} onChange={this.handleCheckboxChange.bind(this)}/>*/}
                <div id="creditContainer" style={{display:"none"}}></div>
            </div>
        );
    }
}
