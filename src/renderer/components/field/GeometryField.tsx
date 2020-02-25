import * as React from 'react';
import { AnchorButton, Intent, ControlGroup } from "@blueprintjs/core";
import { toTextValue } from "./Field";
import { TextField, TextFieldValue } from "./TextField";
import { GeometryDialog } from "../GeometryDialog";
import { GeometryType, validateGeometryValue } from "../../../common/geometry-util";
import { GeometryWKTGetter } from "../../containers/editor/ValueEditor";


interface IGeometryFieldProps {
    value: TextFieldValue | any;
    onChange: (value: TextFieldValue) => void;
    geometryType: GeometryType;
    placeholder?: string;
    size?: number;
    nullable?: boolean;
    disabled?: boolean;
    geometryWKTGetter?: GeometryWKTGetter;
}

interface IGeometryFieldState {
    isEditorOpen: boolean;
}

export class GeometryField extends React.Component<IGeometryFieldProps, IGeometryFieldState> {
    private static DIV_STYLE = {width: '24em', display: 'flex', flexGrow: 1};
    private static TEXT_FIELD_STYLE = {flexGrow: 1};
    private static BUTTON_STYLE = {flex: 'none'};

    constructor(props: IGeometryFieldProps) {
        super(props);
        this.validateGeometryText = this.validateGeometryText.bind(this);
        this.state = {isEditorOpen: false};
        this.setGeometryWKT = this.setGeometryWKT.bind(this);
    }

    validateGeometryText(value: string | null) {
        validateGeometryValue(value, this.props.geometryType);
    }

    setGeometryWKT() {
        let wkt;
        try {
            wkt = this.props.geometryWKTGetter && this.props.geometryWKTGetter();
        } catch (error) {
            console.error(error);
            wkt = "Error: " + error;
        }
        this.props.onChange({textValue: wkt, value: wkt});
    }

    render() {
        let placeholder = this.props.placeholder;
        if (!placeholder) {
            if (this.props.geometryType === 'Point') {
                placeholder = "<lon>,<lat> or Point WKT";
            } else if (this.props.geometryType === 'Polygon') {
                placeholder = "<lon1>,<lat1>,<lon2>,<lat2> or Polygon WKT";
            } else {
                placeholder = `Enter ${this.props.geometryType} WKT`;
            }
        }
        return (
            <ControlGroup style={GeometryField.DIV_STYLE}>
                <TextField
                    value={this.props.value}
                    onChange={this.props.onChange}
                    size={this.props.size || 32}
                    placeholder={placeholder}
                    validator={this.validateGeometryText}
                    nullable={this.props.nullable}
                    style={GeometryField.TEXT_FIELD_STYLE}
                />

                <AnchorButton icon="selection" style={GeometryField.BUTTON_STYLE}
                              disabled={!this.props.geometryWKTGetter}
                              onClick={this.setGeometryWKT}/>

                <AnchorButton intent={Intent.PRIMARY} style={GeometryField.BUTTON_STYLE}
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
            </ControlGroup>
        );
    }
}
