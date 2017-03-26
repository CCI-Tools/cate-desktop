import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {GeometryInputDialog, GeometryType, validateGeometryValue} from "../../components/GeometryInputDialog";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";


interface IGeometryValueEditorProps extends IValueEditorProps<string> {
    geometryType: GeometryType;
    fieldPlaceholder?: string;
    fieldSize?: number;
}

interface IGeometryValueEditorState {
    isDetailsEditorOpen: boolean;
}

export class GeometryValueEditor extends React.Component<IGeometryValueEditorProps, IGeometryValueEditorState> {

    constructor(props: IGeometryValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.validateText = this.validateText.bind(this);
        this.state = {isDetailsEditorOpen: false};
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    validateText(value: string) {
        validateGeometryValue(value, this.props.geometryType);
    }

    render() {
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <TextField
                    value={this.props.value}
                    size={this.props.fieldSize || 32}
                    placeholder={this.props.fieldPlaceholder}
                    validator={this.validateText}
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
                                         this.setState({isDetailsEditorOpen: false});
                                     }}
                                     geometryType={this.props.geometryType}/>
            </div>
        );
    }
}



