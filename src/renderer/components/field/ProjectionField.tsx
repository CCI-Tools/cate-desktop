import * as React from 'react';
import {Button} from "@blueprintjs/core";
import {FieldValue, IFieldProps, toTextValue} from "./Field";
import {TextField} from "./TextField";
import {ProjectionDialog} from "../ProjectionDialog";
import {validateProjectionCode} from "../../../common/projection-util";


interface IProjectionFieldProps extends IFieldProps<string> {
    fieldPlaceholder?: string;
    fieldSize?: number;
    onChange: (value: FieldValue<string>) => void;
}

interface IProjectionFieldState {
    isEditorOpen: boolean;
}

export class ProjectionField extends React.Component<IProjectionFieldProps, IProjectionFieldState> {

    constructor(props: IProjectionFieldProps) {
        super(props);
        this.validateText = this.validateText.bind(this);
        this.state = {isEditorOpen: false};
    }

    //noinspection JSMethodCanBeStatic
    validateText(value: string) {
        validateProjectionCode(value);
    }

    render() {
        return (
            <div className="pt-control-group">
                <TextField
                    value={this.props.value}
                    size={this.props.fieldSize || 12}
                    placeholder={this.props.fieldPlaceholder || "Enter projection code"}
                    validator={this.validateText}
                    onChange={this.props.onChange}
                    disabled={this.props.disabled}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isEditorOpen: true})} disabled={this.props.disabled}>...</Button>

                <ProjectionDialog isOpen={this.state.isEditorOpen}
                                  projectionCode={toTextValue(this.props.value)}
                                  onConfirm={(value: string) => {
                                      this.setState({isEditorOpen: false});
                                      this.props.onChange({textValue: value, value: value});
                                  }}
                                  onCancel={() => {
                                      this.setState({isEditorOpen: false});
                                  }}
                />
            </div>
        );
    }
}



