import * as React from 'react';
import { IValueEditorProps } from './ValueEditor';
import { FieldValue } from '../../components/field/Field';
import { ScriptField } from '../../components/field/ScriptField';

interface IScriptValueEditorProps extends IValueEditorProps<string> {
    placeholder?: string;
    size?: number;
}

export class ScriptValueEditor extends React.Component<IScriptValueEditorProps, null> {

    constructor(props: IScriptValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    render() {
        return (
            <ScriptField
                value={this.props.value}
                onChange={this.onChange}
                placeholder={this.props.placeholder}
                size={this.props.size}
                scriptLang={this.props.input.scriptLang}
                nullable={this.props.input.nullable}/>
        );
    }
}



