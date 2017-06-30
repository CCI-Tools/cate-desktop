import * as React from 'react';
import {NumericField, NumericFieldValue} from "./field/NumericField";


export interface RegionValue {
    west: NumericFieldValue;
    south: NumericFieldValue;
    east: NumericFieldValue;
    north: NumericFieldValue;
}

interface IRegionProps {
    value: RegionValue;
    onChange: (region: RegionValue) => void;
    disabled?: boolean;
    uncontrolled?: boolean;
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
    private static readonly NUMBER_FIELD_STYLE = {textAlign: "right"};

    constructor(props: IRegionProps) {
        super(props);
        this.onEastChange = this.onEastChange.bind(this);
        this.onSouthChange = this.onSouthChange.bind(this);
        this.onWestChange = this.onWestChange.bind(this);
        this.onNorthChange = this.onNorthChange.bind(this);
    }

    onWestChange(value: NumericFieldValue) {
        this.props.onChange({...this.props.value, west: value});
    }

    onEastChange(value: NumericFieldValue) {
        this.props.onChange({...this.props.value, east: value});
    }

    onNorthChange(value: NumericFieldValue) {
        this.props.onChange({...this.props.value, north: value});
    }

    onSouthChange(value: NumericFieldValue) {
        this.props.onChange({...this.props.value, south: value});
    }

    render() {
        let value = this.props.value;
        return (
            <div disabled={this.props.disabled}>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', padding: 2}}>
                    <div style={{flexGrow: 0, width: '14em'}}>Lon. from </div>
                    <div
                        style={{flexGrow: 1, width: '100%'}}>{this.renderField(value && value.west || null, -180, 180, this.onWestChange)}</div>
                    <div style={{flexGrow: 0, width: '4em'}}> to </div>
                    <div
                        style={{flexGrow: 1, width: '100%'}}>{this.renderField(value && value.east || null, -180, 180, this.onEastChange)}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', padding: 2}}>
                    <div style={{flexGrow: 0, width: '14em'}}>Lat. from </div>
                    <div
                        style={{flexGrow: 1, width: '100%'}}>{this.renderField(value && value.south || null, -90, 90, this.onSouthChange)}</div>
                    <div style={{flexGrow: 0, width: '4em'}}>to </div>
                    <div
                        style={{flexGrow: 1, width: '100%'}}>{this.renderField(value && value.north || null, -90, 90, this.onNorthChange)}</div>
                </div>
            </div>
        );
    }

    renderField(value: NumericFieldValue, min: number, max: number, onChange: (number) => void) {
        return (<NumericField value={value}
                              style={Region.NUMBER_FIELD_STYLE}
                              min={min}
                              max={max}
                              size={10}
                              onChange={onChange}
                              disabled={this.props.disabled}
                              nullable={true}
                              uncontrolled={this.props.uncontrolled}
        />);
    }
}


