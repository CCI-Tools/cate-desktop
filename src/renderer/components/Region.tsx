import * as React from 'react';
import {FieldValue} from "./Field";
import {NumberField} from "./NumberField";

export interface RegionValue {
    west: FieldValue<number>;
    south: FieldValue<number>;
    east: FieldValue<number>;
    north: FieldValue<number>;
}

interface IRegionProps {
    value: RegionValue;
    onChange: (region: RegionValue) => void;
    disabled?: boolean;
}

export const GLOBAL: RegionValue = {
    west: {value: -180},
    south: {value: -90},
    east: {value: 180},
    north: {value: 90},
};

/**
 * An editor for objects which have the properties west, east, south, north of type number.
 */
export class Region extends React.PureComponent<IRegionProps, null> {

    constructor(props: IRegionProps) {
        super(props);
        this.onEastChange = this.onEastChange.bind(this);
        this.onSouthChange = this.onSouthChange.bind(this);
        this.onWestChange = this.onWestChange.bind(this);
        this.onNorthChange = this.onNorthChange.bind(this);
    }

    onWestChange(value: FieldValue<number>) {
        this.props.onChange({...this.props.value, west: value});
    }

    onEastChange(value: FieldValue<number>) {
        this.props.onChange({...this.props.value, east: value});
    }

    onNorthChange(value: FieldValue<number>) {
        this.props.onChange({...this.props.value, north: value});
    }

    onSouthChange(value: FieldValue<number>) {
        this.props.onChange({...this.props.value, south: value});
    }

    render() {
        let disabled = this.props.disabled;
        return (
            <div>
                <table disabled={this.props.disabled}>
                    <tbody>
                    <tr>
                        <td>W</td>
                        <td>{this.renderField(this.props.value.west, -180, 180, this.onWestChange)}</td>
                        <td> E</td>
                        <td>{this.renderField(this.props.value.east, -180, 180, this.onEastChange)}</td>
                    </tr>
                    <tr>
                        <td>S</td>
                        <td>{this.renderField(this.props.value.south, -90, 90, this.onSouthChange)}</td>
                        <td> N</td>
                        <td>{this.renderField(this.props.value.north, -90, 90, this.onNorthChange)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderField(value: FieldValue<number>, min: number, max: number, onChange: (number) => void) {
        return (<NumberField value={value}
                             textAlign="right"
                             min={min}
                             max={max}
                             columns={8}
                             onChange={onChange}
                             disabled={this.props.disabled}
        />);
    }
}


