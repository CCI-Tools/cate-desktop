import * as React from "react";
import {Tooltip, Switch} from "@blueprintjs/core";
import {LabelWithType} from "./LabelWithType";
import {ResourceState} from "../state";

export interface IParameterEditorProps {
    name: string;
    dataType: string;
    valueEditor?: JSX.Element;
    tooltipText?: string;
    units?: string;
    resources: Array<ResourceState>;
    resourceName?: string|null;
    isValueEditorShown?: boolean;
    onChange?: (resourceName: string, isValueEditorShown: boolean) => void;
}

/**
 * A component that is used as a parameter editor.
 *
 * @author Norman Fomferra
 */
export class ParameterEditor extends React.PureComponent<IParameterEditorProps, null> {
    constructor(props: IParameterEditorProps) {
        super(props);
    }

    private handleChange(resourceName: string, isValueEditorShown: boolean) {
        if (this.props.onChange) {
            this.props.onChange(resourceName, isValueEditorShown);
        }
    }

    render() {
        const isValueEditorShown: boolean = !!(this.props.isValueEditorShown && this.props.valueEditor);

        let editor;
        if (isValueEditorShown) {
            editor = this.props.valueEditor;
        } else {
            const firstResourceOption = (<option key='__first__' value=''>Select resource...</option>);
            const otherResourceOptions = (this.props.resources || []).map(resource => {
                if (this.isDataTypeCompatible(resource)) {
                    return (
                        <option key={resource.name} value={resource.name}>
                            {resource.name}
                        </option>
                    );
                } else {
                    return null;
                }
            });
            const resourceOptions = [firstResourceOption].concat(otherResourceOptions);
            editor = (
                <div className="pt-select pt-intent-primary">
                    <select value={this.props.resourceName || ''}
                            disabled={otherResourceOptions.length == 0}
                            onChange={(event:any) => this.handleChange(event.target.value, this.props.isValueEditorShown)}>
                        {resourceOptions}
                    </select>
                </div>
            );
        }

        let isValueEditorDisabled = !this.props.valueEditor;
        const editorSwitch = (
            <div>
                <Tooltip content={(isValueEditorShown ? "Switch to resource selection" : "Switch to value entry") + (isValueEditorDisabled ? ' (disabled)' : '')}>
                    <Switch checked={isValueEditorShown}
                            disabled={isValueEditorDisabled}
                            style={{marginLeft: '1em', marginBottom: 0}}
                            onChange={(event:any) => this.handleChange(this.props.resourceName, event.target.checked)}/>
                </Tooltip>
            </div>
        );

        return (
            <div key={this.props.name} style={{display: 'flex', alignItems: 'center', padding: '0.2em'}}>
                <LabelWithType style={{flex: 'auto'}}
                               label={this.props.name}
                               units={this.props.units}
                               dataType={this.props.dataType}
                               tooltipText={this.props.tooltipText}/>
                {editor}
                {editorSwitch}
            </div>
        );
    }

    /**
     * Naive test if a resource's dataType is compatible with the one this editor is dedicated to.
     */
    private isDataTypeCompatible(resource) {
        // type 'object' matches any other type
        return this.props.dataType === 'object'
            || this.props.dataType === resource.dataType;
    }
}

