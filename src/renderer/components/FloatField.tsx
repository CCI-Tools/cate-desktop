import * as React from 'react'

import {EditField, IEditFieldProps} from "./EditField";

type FloatOrNull = number|null;

export interface IFloatFieldProps extends IEditFieldProps<FloatOrNull> {
    exponential?: boolean;
    fractionDigits?: number;
}

/**
 * A FloatField is an input field that provides a floating point number.
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class FloatField extends EditField<FloatOrNull, IFloatFieldProps> {

    protected parseValue(textValue: string): FloatOrNull {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const value = parseFloat(textValue);
        if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
            throw new Error('Please enter a valid number.');
        }
        return value;
    }

    protected formatValue(value: FloatOrNull): string {
        if (!value && value !== 0.0) {
            return '';
        }
        let digits = this.props.fractionDigits;
        let exponential = this.props.exponential;
        if (digits || digits === 0) {
            return exponential ? value.toExponential(digits) : value.toFixed(digits);
        } else {
            return exponential ? value.toExponential(1) : value.toString();
        }
    }
}
