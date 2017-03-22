import * as React from 'react';
import {NumberField} from "./NumberField";

interface Value {
    west: string;
    south: string;
    east: string;
    north: string;
}

interface IRegionProps {
    value: Value;
    onChange: (value: Value) => void;
    disabled?: boolean;
}

export const GLOBAL: Value = {
    west: "-180",
    south: "-90",
    east: "180",
    north: "90",
};

/**
 * An editor for objects which have the properties west, east, south, north of type number.
 */
export class Region extends React.PureComponent<IRegionProps, null> {

    constructor(props: IRegionProps) {
        super(props);
    }

    onWestChange(textValue: string) {
        this.props.onChange({...this.props.value, west: textValue});
    }

    onEastChange(textValue: string) {
        this.props.onChange({...this.props.value, east: textValue});
    }

    onNorthChange(textValue: string) {
        this.props.onChange({...this.props.value, north: textValue});
    }

    onSouthChange(textValue: string) {
        this.props.onChange({...this.props.value, south: textValue});
    }

    render() {
        const fractionDigits = 4;
        let disabled = this.props.disabled;
        return (
            <div>
                <table disabled={this.props.disabled}>
                    <tbody>
                    <tr>
                        <td>W</td>
                        <td>{this.renderFloatField(this.props.value.west, -180, 180, this.onWestChange.bind(this))}</td>
                        <td> E</td>
                        <td>{this.renderFloatField(this.props.value.east, -180, 180, this.onEastChange.bind(this))}</td>
                    </tr>
                    <tr>
                        <td>S</td>
                        <td>{this.renderFloatField(this.props.value.south, -90, 90, this.onSouthChange.bind(this))}</td>
                        <td> N</td>
                        <td>{this.renderFloatField(this.props.value.north, -90, 90, this.onNorthChange.bind(this))}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderFloatField(textValue: string, min: number, max: number, onChange: (number) => void) {
        return (<NumberField textValue={textValue}
                             textAlign="right"
                             min={min}
                             max={max}
                             columns={8}
                             onChange={onChange}
                             disabled={this.props.disabled}
        />);
    }
}


