import * as React from 'react'

import {Field, IFieldProps} from "./Field";
import {NumericInput, Intent} from "@blueprintjs/core";

type NumberOrNull = number|null;

export interface INumberFieldProps extends IFieldProps<NumberOrNull> {
    exponential?: boolean;
    min?: number;
    max?: number;
    isInt?: boolean;
}


function isNumber(value: any): boolean {
    return typeof(value) === 'number';
}

/**
 * A NumberField is an input field that provides a floating point number.
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class NumberField extends Field<NumberOrNull, INumberFieldProps> {

    constructor(props: INumberFieldProps) {
        super(props);
        this.onValueChange = this.onValueChange.bind(this);
    }

    protected parseValue(textValue: string): NumberOrNull {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const value = parseFloat(textValue);
        if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
            throw new Error('Please enter a valid number.');
        }
        return value;
    }

    protected validateValue(value: number): void {
        super.validateValue(value);
        if (this.props.isInt && value !== Math.floor(value)) {
            throw new Error('Value must be an integer');
        }
        if (isNumber(this.props.min) && value < this.props.min) {
            throw new Error('Value must be >= ' + this.props.min);
        }
        if (isNumber(this.props.max) && value > this.props.max) {
            throw new Error('Value must be <= ' + this.props.max);
        }
    }

    protected formatValue(value: NumberOrNull): string {
        if (!value && value !== 0.0) {
            return '';
        }
        return value.toString();
    }

    onValueChange(valueAsNumber: number, valueAsString: string) {
        super.notifyValueChange(valueAsString, valueAsNumber);
    }

    render() {
        return (<NumericInput onValueChange={this.onValueChange}
                              value={this.computeTextValue()}
                              style={this.computeStyle()}
                              intent={this.props.error ? Intent.DANGER : Intent.NONE}
                              min={this.props.min}
                              max={this.props.max}
                              minorStepSize={this.props.isInt ? 1: 0.1}
                              selectAllOnFocus={true}
        />);
    }
}
