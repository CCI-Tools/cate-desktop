import * as React from "react";
import {Switch} from "@blueprintjs/core";
import {LabelWithType} from "./LabelWithType";
import {ResourceState} from "../state";

export interface IParameterEditorProps {
    name: string;
    dataType: string;
    valueEditor?: JSX.Element;
    tooltipText?: string; // todo: use me!
    units?: string; // todo: use me!
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
        const isValueEditorUsable:boolean = !!(this.props.isValueEditorShown && this.props.valueEditor);

        let editor;
        if (isValueEditorUsable) {
            editor = this.props.valueEditor;
        } else {
            const firstResourceOption = (<option key='__first__' value=''>Select resource...</option>);
            const otherResourceOptions = (this.props.resources || []).map(resource => (
                <option key={resource.name} value={resource.name}>
                    <LabelWithType label={resource.name} dataType={resource.dataType}/>
                </option>)
            );
            const resourceOptions = [firstResourceOption].concat(otherResourceOptions);
            editor = (
                <div className="pt-select pt-intent-primary">
                    <select value={this.props.resourceName}
                            onChange={(event:any) => this.handleChange(event.target.value, this.props.isValueEditorShown)}>
                        {resourceOptions}
                    </select>
                </div>
            );
        }

        const editorSwitch = (
            <Switch checked={isValueEditorUsable}
                    disabled={!this.props.valueEditor}
                    style={{marginLeft: '0.2em', marginBottom: 0}}
                    onChange={(event:any) => this.handleChange(this.props.resourceName, event.target.checked)}/>
        );

        return (
            <div key={this.props.name} style={{display: 'flex', alignItems: 'center', padding: '0.2em'}}>
                <LabelWithType style={{flex: 'auto'}} label={this.props.name} dataType={this.props.dataType}/>
                {editor}
                {editorSwitch}
            </div>
        );
    }
}

