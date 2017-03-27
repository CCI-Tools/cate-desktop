import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {FieldValue} from "../../components/field/Field";
import {GeometryField} from "../../components/field/GeometryField";
import {GeometryType} from "../../../common/geometry-util";

interface IGeometryValueEditorProps extends IValueEditorProps<string> {
    geometryType: GeometryType;
    fieldPlaceholder?: string;
    fieldSize?: number;
}

export class GeometryValueEditor extends React.Component<IGeometryValueEditorProps, null> {

    constructor(props: IGeometryValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    render() {
        return (
            <GeometryField
                value={this.props.value}
                onChange={this.onChange}
                fieldPlaceholder={this.props.fieldPlaceholder}
                fieldSize={this.props.fieldSize}
                geometryType={this.props.geometryType}/>
        );
    }
}



