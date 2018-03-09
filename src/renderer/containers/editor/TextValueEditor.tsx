import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {ValueSetValueEditor} from "./ValueSetValueEditor";
import {TextField} from "../../components/field/TextField";


export function TextValueEditor(props: IValueEditorProps<string>) {
    if (ValueSetValueEditor.isValueSetGiven(props.input)) {
        return (
            <ValueSetValueEditor input={props.input}
                                 value={props.value}
                                 onChange={props.onChange}/>);
    } else {
        return (
            <TextField size={24}
                       value={props.value}
                       nullable={props.input.nullable}
                       onChange={value => props.onChange(props.input, value)}
            />
        );
    }
}
