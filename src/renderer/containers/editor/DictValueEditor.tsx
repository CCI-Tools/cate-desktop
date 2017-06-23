import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";

// Note: DictValueEditor and ArbitraryValueEditor are almost the same - use the React HLC pattern

interface IDictValueEditorProps extends IValueEditorProps<string> {
}

export class DictValueEditor extends React.Component<IDictValueEditorProps, null> {
    private static TEXT_FIELD_STYLE = {flexGrow: 1};

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
                style={DictValueEditor.TEXT_FIELD_STYLE}
                nullable={this.props.input.nullable}
            />
        );
    }
}

export function validateDictText(value: string|null) {
    if (!value || value.trim() === '') {
        return;
    }
    // Define Python eval context:
    //
    //noinspection JSUnusedLocalSymbols
    const None = null;
    //noinspection JSUnusedLocalSymbols
    const True = true;
    //noinspection JSUnusedLocalSymbols
    const False = false;
    //
    // To validate, e.g. "layers=3, time=19", try eval("var layers=3, time=19;")
    // which should succeed if value is fine
    eval(`var ${value};`);
}
