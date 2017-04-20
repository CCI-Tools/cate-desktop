import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";

interface IDictValueEditorProps extends IValueEditorProps<string> {
}

export class DictValueEditor extends React.Component<IDictValueEditorProps, null> {

    constructor(props: IDictValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        return (
            <TextField
                value={textValue}
                validator={validateDictText}
                size={36}
                placeholder='Enter key-value pairs (Python), separated by comma'
                onChange={this.onChange}
                style={{flexGrow: 1}}
            />
        );
    }
}

export function validateDictText(value: string) {
    // Define Python eval context:
    //
    //noinspection JSUnusedLocalSymbols
    const None = null;
    //noinspection JSUnusedLocalSymbols
    const True = true;
    //noinspection JSUnusedLocalSymbols
    const False = false;
    //
    // To validate, try eval() which should succeed if value is fine
    eval(value);
}
