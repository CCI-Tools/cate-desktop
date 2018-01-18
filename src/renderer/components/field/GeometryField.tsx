import * as React from 'react';
import {AnchorButton} from "@blueprintjs/core";
import {toTextValue} from "./Field";
import {TextField, TextFieldValue} from "./TextField";
import {GeometryDialog} from "../GeometryDialog";
import {GeometryType, validateGeometryValue} from "../../../common/geometry-util";
import * as Cesium from "cesium";
import {entityToGeometryWKT} from "../../cesium-util";


interface IGeometryFieldProps {
    value: TextFieldValue | any;
    onChange: (value: TextFieldValue) => void;
    geometryType: GeometryType;
    placeholder?: string;
    size?: number;
    nullable?: boolean;
    disabled?: boolean;
    selectedEntity?: Cesium.Entity | null;
}

interface IGeometryFieldState {
    isEditorOpen: boolean;
}

export class GeometryField extends React.Component<IGeometryFieldProps, IGeometryFieldState> {

    constructor(props: IGeometryFieldProps) {
        super(props);
        this.validateGeometryText = this.validateGeometryText.bind(this);
        this.state = {isEditorOpen: false};
        this.setSelectedEntityWKT = this.setSelectedEntityWKT.bind(this);
    }

    validateGeometryText(value: string  | null) {
        validateGeometryValue(value, this.props.geometryType);
    }

    setSelectedEntityWKT() {
        let wkt;
        try {
            wkt = entityToGeometryWKT(this.props.selectedEntity);
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
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <TextField
                    value={this.props.value}
                    onChange={this.props.onChange}
                    size={this.props.size || 32}
                    placeholder={placeholder}
                    validator={this.validateGeometryText}
                    nullable={this.props.nullable}
                />

                <AnchorButton className="pt-intent-primary pt-icon-selection" style={{flex: 'none'}}
                              disabled={!this.props.selectedEntity}
                              onClick={this.setSelectedEntityWKT}/>

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
