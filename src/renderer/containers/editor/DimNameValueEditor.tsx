import * as React from 'react';
import { AnchorButton, ControlGroup, Intent } from '@blueprintjs/core';
import { IValueEditorProps } from './ValueEditor';
import { FieldValue, toTextValue } from '../../components/field/Field';
import { TextField } from '../../components/field/TextField';
import { DimensionsDialog } from '../DimensionsDialog';

interface IDimNamesValueEditorProps extends IValueEditorProps<string> {
    dimNames: string[];
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
        validateDimNamesText(value, this.props.input.nullable, this.props.multi, this.props.dimNames);
    }

    render() {
        const textValue = toTextValue(this.props.value);
        const valueDims = textValue !== '' ? textValue.split(',').map(name => name.trim()) : [];
        const hasSelectableDims = this.props.dimNames && this.props.dimNames.length;
        return (
            <ControlGroup style={DimNameValueEditor.DIV_STYLE}>
                <TextField
                    value={this.props.value}
                    validator={this.validate}
                    size={this.props.multi ? 36 : 24}
                    placeholder={this.props.multi ? 'Enter dimension names, separated by comma' : 'Enter dimension name'}
                    onChange={this.onChange}
                    nullable={this.props.input.nullable}
                    style={DimNameValueEditor.TEXT_FIELD_STYLE}
                />

                <AnchorButton intent={Intent.PRIMARY}
                              onClick={() => this.setState({isDetailsEditorOpen: true})}
                              disabled={!hasSelectableDims}
                              style={DimNameValueEditor.BUTTON_STYLE}>...</AnchorButton>

                <DimensionsDialog isOpen={this.state.isDetailsEditorOpen}
                                  dimNames={this.props.dimNames}
                                  multiSelect={this.props.multi}
                                  value={valueDims}
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

export function validateDimNamesText(value: string | null, nullable: boolean, multi: boolean, dimNames: string[]) {
    if (!value || value.trim() === '') {
        if (!nullable) {
            throw new Error(multi ? 'One or more dimension names expected.' : 'Dimension name expected.');
        }
        return;
    }
    const valueDims = value.split(',');
    if (multi) {
        for (let dimName of valueDims) {
            if (dimName.trim() === '') {
                throw new Error('Value must be a comma-separated list of dimension names.');
            }
        }
    } else {
        if (valueDims.length !== 1) {
            throw new Error('Value must be a single dimension name.');
        }
        if (valueDims[0].trim() === '') {
            throw new Error('Value must be a dimension name.');
        }
    }
    if (dimNames) {
        for (let dimName of valueDims) {
            const dimSet = new Set(dimNames);
            if (!dimSet.has(dimName)) {
                throw new Error(`"${dimName}" is not a valid dimension. Valid dimensions are: "${dimNames}"`);
            }
        }
    }
}
