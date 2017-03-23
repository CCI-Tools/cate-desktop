import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {ValueSetValueEditor} from "./ValueSetValueEditor";
import {NumericField} from "../../components/field/NumericField";

// TODO (forman): complete me, i.e. use input.valueRange!

export function IntegerValueEditor(props: IValueEditorProps<number>) {
    if (ValueSetValueEditor.isValueSetGiven(props.input)) {
        return (
            <ValueSetValueEditor input={props.input}
                                 value={props.value}
                                 onChange={props.onChange}/>);
    } else {
        return (
            <NumericField isInt={true}
                          size={10}
                          value={props.value}
                          nullable={props.input.nullable}
                          onChange={value => props.onChange(props.input, value)}
            />
        );
    }
}
