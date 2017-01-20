import * as React from 'react'

import {EditField, IEditFieldProps} from "./EditField";

type StringOrNull = string|null;

export interface ITextFieldProps extends IEditFieldProps<StringOrNull> {
}

/**
 * A TextField is an input field that provides a text (string) value.
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class TextField extends EditField<StringOrNull, ITextFieldProps> {

    protected parseValue(textValue: string): StringOrNull {
        if (textValue === null || textValue.trim() === '') {
            return null;
        }
        return textValue;
    }

    protected formatValue(value: StringOrNull): string {
        return value || '';
    }
}
