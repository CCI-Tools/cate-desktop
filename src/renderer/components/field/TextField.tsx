import * as React from 'react'

import {Field, FieldType, FieldValue, IFieldProps} from "./Field";

export type TextFieldType = FieldType<string>;
export type TextFieldValue = FieldValue<string>;

/**
 * A TextField represents a text input field providing values of type string.
 *
 * @author Norman Fomferra
 */
export class TextField extends Field<IFieldProps> {
    constructor(props: IFieldProps) {
        super(props);
    }
}

