import * as React from 'react'
import {IEditFieldProps, EditField} from "./EditField";

export type NumericRange = [number, number];
export type NumericRangeOrNull = NumericRange|null;

export interface INumericRangeFieldProps extends IEditFieldProps<NumericRangeOrNull> {
    exponential?: boolean;
    fractionDigits?: number;
}

/**
 * A NumericRangeField is an input field that provides a numeric range of two number values (x1 and x2 properties).
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class NumericRangeField extends EditField<NumericRangeOrNull, INumericRangeFieldProps> {

    protected parseValue(textValue: string): NumericRangeOrNull {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const pair = textValue.split(',');
        if (pair.length == 2) {
            let x1 = parseFloat(pair[0]);
            let x2 = parseFloat(pair[1]);
            if (x2 < x1) {
                const t = x1;
                x1 = x2;
                x2 = t;
            }
            return [x1, x2];
        } else {
            throw new Error('Value must be a pair of numbers');
        }
    }

    protected formatValue(value: NumericRangeOrNull): string {
        if (!value || value.length < 2) {
            return '';
        }
        return this.formatNumber(value[0]) + ", " + this.formatNumber(value[1]);
    }

    private formatNumber(value: number): string {
        const digits = this.props.fractionDigits || 0;
        return this.props.exponential ? value.toExponential(digits) : value.toFixed(digits)
    }
}
