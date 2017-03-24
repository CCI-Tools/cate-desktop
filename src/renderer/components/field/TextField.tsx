import * as React from 'react'

import {Field, IFieldProps} from "./Field";

/**
 * A TextField represents a text input field providing values of type string.
 *
 * @author Norman Fomferra
 */
export class TextField extends Field<string, IFieldProps<string>> {
    constructor(props: IFieldProps<string>) {
        super(props);
    }

    protected parseValue(textValue: string): any | string {
        if (this.props.nullable && textValue === '') {
            return null;
        }
        return textValue;
    }
}

