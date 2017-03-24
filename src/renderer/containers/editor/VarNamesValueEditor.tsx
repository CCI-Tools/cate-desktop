import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";
import {VariablesDialog} from "../VariablesDialog";
import {ResourceState} from "../../state";

interface IVariableNamesValueEditorProps extends IValueEditorProps<string> {
    resource: ResourceState;
}

interface IVariableNamesValueEditorState {
    isDetailsEditorOpen: boolean;
}

export class VarNamesValueEditor extends React.Component<IVariableNamesValueEditorProps, IVariableNamesValueEditorState> {

    constructor(props: IVariableNamesValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = {isDetailsEditorOpen: false};
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        const varNames = textValue !== '' ? textValue.split(',').map(name => name.trim()) : [];
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <TextField
                    value={this.props.value}
                    validator={validateVarNamesText}
                    size={36}
                    placeholder='Enter variable names, separated by comma'
                    onChange={this.onChange}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isDetailsEditorOpen: true})}>...</Button>

                <VariablesDialog isOpen={this.state.isDetailsEditorOpen}
                                 resource={this.props.resource}
                                 value={varNames}
                                 onConfirm={(value: string[]) => {
                                     const textValue = value ? value.join(', ') : null;
                                     this.setState({isDetailsEditorOpen: false});
                                     this.onChange({textValue, value: textValue});
                                 }}
                                 onCancel={() => {
                                     this.setState({isDetailsEditorOpen: false} as any);
                                 }}/>
            </div>
        );
    }
}

export function validateVarNamesText(value: string) {
    if (value.trim() !== '') {
        const varNames = value.split(',');
        for (let varName of varNames) {
            if (varName.trim() === '') {
                throw new Error('All variable names must be valid.');
            }
        }
    }
}
