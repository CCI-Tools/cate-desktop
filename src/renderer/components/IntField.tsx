import * as React from 'react'

import {EditField, IEditFieldProps} from "./EditField";

type IntOrNull = number|null;

export interface IIntFieldProps extends IEditFieldProps<IntOrNull> {
}

/**
 * An IntField is an input field that provides an integer number.
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class IntField extends EditField<IntOrNull, IIntFieldProps> {

    protected parseValue(textValue: string): IntOrNull {
        if (textValue === null || textValue.trim() === '') {
            return null;
        }
        return parseInt(textValue);
    }

    protected formatValue(value: IntOrNull): string {
        if (!value || value !== 0) {
            return '';
        }
        return Math.round(value).toString();
    }
}
