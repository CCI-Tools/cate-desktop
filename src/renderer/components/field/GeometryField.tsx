import * as React from 'react';
import {Button} from "@blueprintjs/core";
import {FieldValue, IFieldProps, toTextValue} from "./Field";
import {TextField} from "./TextField";
import {GeometryDialog} from "../GeometryDialog";
import {GeometryType, validateGeometryValue} from "../../../common/geometry-util";


interface IGeometryFieldProps extends IFieldProps<string> {
    geometryType: GeometryType;
    fieldPlaceholder?: string;
    fieldSize?: number;
    onChange: (value: FieldValue<string>) => void;
}

interface IGeometryFieldState {
    isEditorOpen: boolean;
}

export class GeometryField extends React.Component<IGeometryFieldProps, IGeometryFieldState> {

    constructor(props: IGeometryFieldProps) {
        super(props);
        this.validateText = this.validateText.bind(this);
        this.state = {isEditorOpen: false};
    }

    validateText(value: string) {
        validateGeometryValue(value, this.props.geometryType);
    }

    render() {
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}} disabled={this.props.disabled}>
                <TextField
                    value={this.props.value}
                    size={this.props.fieldSize || 32}
                    placeholder={this.props.fieldPlaceholder || `Enter ${this.props.geometryType} WKT`}
                    validator={this.validateText}
                    onChange={this.props.onChange}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isEditorOpen: true})}>...</Button>

                <GeometryDialog isOpen={this.state.isEditorOpen}
                                     value={toTextValue(this.props.value)}
                                     onConfirm={(value: string) => {
                                         this.setState({isEditorOpen: false});
                                         this.props.onChange({textValue: value, value: value});
                                     }}
                                     onCancel={() => {
                                         this.setState({isEditorOpen: false});
                                     }}
                                     geometryType={this.props.geometryType}/>
            </div>
        );
    }
}
