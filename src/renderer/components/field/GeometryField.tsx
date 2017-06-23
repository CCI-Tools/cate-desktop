import * as React from 'react';
import {AnchorButton} from "@blueprintjs/core";
import {toTextValue} from "./Field";
import {TextField, TextFieldValue} from "./TextField";
import {GeometryDialog} from "../GeometryDialog";
import {GeometryType, validateGeometryValue} from "../../../common/geometry-util";


interface IGeometryFieldProps {
    value: TextFieldValue | any,
    onChange: (value: TextFieldValue) => void;
    geometryType: GeometryType;
    placeholder?: string;
    size?: number;
    disabled?: boolean;
}

interface IGeometryFieldState {
    isEditorOpen: boolean;
}

export class GeometryField extends React.Component<IGeometryFieldProps, IGeometryFieldState> {

    constructor(props: IGeometryFieldProps) {
        super(props);
        this.validateGeometryText = this.validateGeometryText.bind(this);
        this.state = {isEditorOpen: false};
    }

    validateGeometryText(value: string) {
        validateGeometryValue(value, this.props.geometryType);
    }

    render() {
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}} disabled={this.props.disabled}>
                <TextField
                    value={this.props.value}
                    onChange={this.props.onChange}
                    size={this.props.size || 32}
                    placeholder={this.props.placeholder || `Enter ${this.props.geometryType} WKT`}
                    validator={this.validateGeometryText}
                />

                <AnchorButton className="pt-intent-primary" style={{flex: 'none'}}
                              onClick={() => this.setState({isEditorOpen: true})}>...</AnchorButton>

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
