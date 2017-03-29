import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";
import {VariablesDialog} from "../VariablesDialog";
import {ResourceState} from "../../state";

interface IVariableNamesValueEditorProps extends IValueEditorProps<string> {
    resource: ResourceState;
    multi?: boolean;
}

interface IVariableNamesValueEditorState {
    isDetailsEditorOpen: boolean;
}

export class VarNameValueEditor extends React.Component<IVariableNamesValueEditorProps, IVariableNamesValueEditorState> {

    constructor(props: IVariableNamesValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.validate = this.validate.bind(this);
        this.state = {isDetailsEditorOpen: false};
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    validate(value: string) {
        validateVarNamesText(value, this.props.resource, this.props.multi);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        const varNames = textValue !== '' ? textValue.split(',').map(name => name.trim()) : [];
        const hasSelectableVariables = this.props.resource && this.props.resource.variables && this.props.resource.variables.length;
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <TextField
                    value={this.props.value}
                    validator={this.validate}
                    size={36}
                    placeholder='Enter variable names, separated by comma'
                    onChange={this.onChange}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isDetailsEditorOpen: true})}
                        disabled={!hasSelectableVariables}>...</Button>

                <VariablesDialog isOpen={this.state.isDetailsEditorOpen}
                                 resource={this.props.resource}
                                 multiSelect={this.props.multi}
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

export function validateVarNamesText(value: string, resource: ResourceState, multi: boolean) {
    if (value.trim() === '') {
        return;
    }
    const varNames = value.split(',');
    if (multi) {
        for (let varName of varNames) {
            if (varName.trim() === '') {
                throw new Error('Value must be a comma-separated list of variable names.');
            }
        }
    } else {
        if (varNames.length !== 1) {
            throw new Error('Value must be a single variable name.');
        }
        if (varNames[0].trim() === '') {
            throw new Error('Value must be a variable name.');
        }
    }
    const validNames = new Set(resource.variables.map(v => v.name));
    for (let varName of varNames) {
        if (!validNames.has(varName)) {
            throw new Error(`"${varName}" is not a name of any variable in resource ${resource.name}.`);
        }
    }
}
