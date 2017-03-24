import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {GeometryInputDialog} from "../../components/GeometryInputDialog";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";

interface IVariableNamesValueEditorProps extends IValueEditorProps<string> {
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

                <GeometryInputDialog isOpen={this.state.isDetailsEditorOpen}
                                     value={toTextValue(this.props.value)}
                                     onConfirm={(value: string) => {
                                         this.setState({isDetailsEditorOpen: false});
                                         this.onChange({textValue: value, value: value});
                                     }}
                                     onCancel={() => {
                                         this.setState({isDetailsEditorOpen: false} as any);
                                     }}
                                     geometryType={'Polygon'}/>
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
