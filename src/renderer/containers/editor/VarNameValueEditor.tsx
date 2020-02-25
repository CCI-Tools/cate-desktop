import * as React from 'react';
import { AnchorButton, ControlGroup, Intent } from '@blueprintjs/core';
import { IValueEditorProps } from './ValueEditor';
import { FieldValue, toTextValue } from '../../components/field/Field';
import { TextField } from '../../components/field/TextField';
import { VariablesDialog } from '../VariablesDialog';
import { ResourceState } from '../../state';

interface IVariableNamesValueEditorProps extends IValueEditorProps<string> {
    resource: ResourceState;
    multi?: boolean;
}

interface IVariableNamesValueEditorState {
    isDetailsEditorOpen: boolean;
}

export class VarNameValueEditor extends React.Component<IVariableNamesValueEditorProps, IVariableNamesValueEditorState> {

    private static DIV_STYLE = {width: '24em', display: 'flex', flexGrow: 1};
    private static TEXT_FIELD_STYLE = {flexGrow: 1};
    private static BUTTON_STYLE = {flex: 'none'};

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
        validateVarNamesText(value, this.props.input.nullable, this.props.multi, this.props.resource);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        const varNames = textValue !== '' ? textValue.split(',').map(name => name.trim()) : [];
        const hasSelectableVariables = this.props.resource && this.props.resource.variables && this.props.resource.variables.length;
        return (
            <ControlGroup style={VarNameValueEditor.DIV_STYLE}>
                <TextField
                    value={this.props.value}
                    validator={this.validate}
                    size={this.props.multi ? 36 : 24}
                    placeholder={this.props.multi ? 'Enter variable names, separated by comma' : 'Enter variable name'}
                    onChange={this.onChange}
                    nullable={this.props.input.nullable}
                    style={VarNameValueEditor.TEXT_FIELD_STYLE}
                />

                <AnchorButton intent={Intent.PRIMARY}
                              onClick={() => this.setState({isDetailsEditorOpen: true})}
                              disabled={!hasSelectableVariables}
                              style={VarNameValueEditor.BUTTON_STYLE}>...</AnchorButton>

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
            </ControlGroup>
        );
    }
}

export function validateVarNamesText(value: string | null, nullable: boolean, multi: boolean, resource: ResourceState) {
    if (!value || value.trim() === '') {
        if (!nullable) {
            throw new Error(multi ? 'One or more variable names expected.' : 'Variable name expected.');
        }
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
    if (resource && resource.variables) {
        const validNames = new Set(resource.variables.map(v => v.name));
        for (let varName of varNames) {
            if (!validNames.has(varName)) {
                throw new Error(`"${varName}" is not a name of any variable in resource ${resource.name}.`);
            }
        }
    }
}
