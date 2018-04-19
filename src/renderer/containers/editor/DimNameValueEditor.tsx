import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {AnchorButton} from "@blueprintjs/core";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";
import {DimensionsDialog} from "../DimensionsDialog";
import {VariableState} from "../../state";

interface IDimNamesValueEditorProps extends IValueEditorProps<string> {
	variable: VariableState;
	multi?: boolean;
}

interface IDimNamesValueEditorState {
	isDetailsEditorOpen: boolean;
}

export class DimNameValueEditor extends React.Component<IDimNamesValueEditorProps, IDimNamesValueEditorState> {

    private static DIV_STYLE = {width: '24em', display: 'flex', flexGrow: 1};
    private static TEXT_FIELD_STYLE = {flexGrow: 1};
    private static BUTTON_STYLE = {flex: 'none'};

    constructor(props: IDimNamesValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.validate = this.validate.bind(this);
        this.state = {isDetailsEditorOpen: false};
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    validate(value: string) {
        validateDimNamesText(value, this.props.input.nullable, this.props.multi, this.props.variable);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        const dimNames = textValue !== '' ? textValue.split(',').map(name => name.trim()) : [];
        const hasSelectableDims = this.props.variable && this.props.variable.dimNames && this.props.variable.dimNames.length;
        return (
            <div className="pt-control-group" style={DimNameValueEditor.DIV_STYLE}>
                <TextField
                    value={this.props.value}
                    validator={this.validate}
                    size={this.props.multi ? 36 : 24}
                    placeholder={this.props.multi ? 'Enter dimension names, separated by comma' : 'Enter dimension name'}
                    onChange={this.onChange}
                    nullable={this.props.input.nullable}
                    style={DimNameValueEditor.TEXT_FIELD_STYLE}
                />

                <AnchorButton className="pt-intent-primary"
                              onClick={() => this.setState({isDetailsEditorOpen: true})}
                              disabled={!hasSelectableDims}
                              style={DimNameValueEditor.BUTTON_STYLE}>...</AnchorButton>

                <DimensionsDialog isOpen={this.state.isDetailsEditorOpen}
                                  variable={this.props.variable}
                                  multiSelect={this.props.multi}
                                  value={dimNames}
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

export function validateDimNamesText(value: string | null, nullable: boolean, multi: boolean, variable: VariableState) {
    if (!value || value.trim() === '') {
        if (!nullable) {
            throw new Error(multi ? 'One or more dimension names expected.' : 'Dimension name expected.');
        }
        return;
    }
    const dimNames = value.split(',');
    if (multi) {
        for (let dimName of dimNames) {
            if (dimName.trim() === '') {
                throw new Error('Value must be a comma-separated list of dimension names.');
            }
        }
    } else {
        if (dimNames.length !== 1) {
            throw new Error('Value must be a single dimension name.');
        }
        if (dimNames[0].trim() === '') {
            throw new Error('Value must be a dimension name.');
        }
    }
    if (variable && variable.dimNames) {
        const validNames = new Set(variable.dimNames.map(v => v));
        for (let dimName of dimNames) {
            if (!validNames.has(dimName)) {
                throw new Error(`"${dimName}" is not a dimension of variable ${variable.name}.`);
            }
        }
    }
}