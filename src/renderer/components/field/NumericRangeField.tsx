import * as React from 'react'
import {IFieldProps, Field} from "./Field";

export type NumericRange = [number, number];

export interface INumericRangeFieldProps extends IFieldProps<NumericRange> {
}

/**
 * A NumericRangeField is an input field that provides a numeric range of two number values (x1 and x2 properties).
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class NumericRangeField extends Field<NumericRange, INumericRangeFieldProps> {

    protected parseValue(textValue: string): NumericRange | null {
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

    protected formatValue(value: NumericRange | null): string {
        if (!value || value.length < 2) {
            return '';
        }
        return `${value[0]}, ${value[1]}`;
    }
}
