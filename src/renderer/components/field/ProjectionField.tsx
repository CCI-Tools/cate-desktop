import * as React from 'react';
import {AnchorButton} from "@blueprintjs/core";
import {IFieldProps, toTextValue} from "./Field";
import {TextField} from "./TextField";
import {ProjectionDialog} from "../ProjectionDialog";
import {validateProjectionCode} from "../../../common/projection-util";

interface IProjectionFieldProps extends IFieldProps {
    nullable?: boolean;
}

interface IProjectionFieldState {
    isEditorOpen: boolean;
}

export class ProjectionField extends React.Component<IProjectionFieldProps, IProjectionFieldState> {

    constructor(props: IProjectionFieldProps) {
        super(props);
        this.state = {isEditorOpen: false};
        this.validateProjectionText =  this.validateProjectionText.bind(this);
    }

    validateProjectionText(value: string|null) {
        validateProjectionCode(value, this.props.nullable);
    }

    render() {
        return (
            <div className="pt-control-group">
                <TextField
                    value={this.props.value}
                    size={this.props.size || 12}
                    placeholder={this.props.placeholder || "Enter projection code"}
                    validator={this.validateProjectionText}
                    onChange={this.props.onChange}
                    disabled={this.props.disabled}
                    nullable={this.props.nullable}
                />

                <AnchorButton className="pt-intent-primary"
                              onClick={() => this.setState({isEditorOpen: true})}
                              disabled={this.props.disabled}>...</AnchorButton>

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



