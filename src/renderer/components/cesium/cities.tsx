import * as React from 'react';

/*
 "id": "1",
 "name": "New York City",
 "state": "New York",
 "latitude": 40.7127,
 "longitude": -74.0059,
 "visible": true
 */
export interface ICity {
    id: string;
    name: string;
    state: string;
    latitude: number;
    longitude: number;
    visible: boolean;
}

export interface ICesiumCityListProps {
    cities: Array<ICity>;
    onChange: () => any;
}


export class CesiumCityList extends React.Component<ICesiumCityListProps, any> {
    render() {
        let listItems = this.props.cities.map((city) => {
            return (
                <li key={city.id}>
                    <input type="checkbox"
                           value={city.id}
                           onChange={this.props.onChange}
                           checked={city.visible}/>
                    {city.name}
                </li>
            );
        });
        return (
            <ul className='cesium-city-list'>
                {listItems}
            </ul>
        );
    }
}

