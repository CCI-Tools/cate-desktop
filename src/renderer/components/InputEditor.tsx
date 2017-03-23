import * as React from "react";
import {Tooltip, Switch} from "@blueprintjs/core";
import {LabelWithType} from "./LabelWithType";
import {ResourceState} from "../state";

export interface IInputEditorProps {
    name: string;
    dataType: string;
    valueEditor?: JSX.Element;
    tooltipText?: string;
    units?: string;
    resources: Array<ResourceState>;
    resourceName?: string|null;
    isValueEditorShown?: boolean;
    /**
     * Notified if a resource is selected or deselected.
     * @param resourceName The resource name or null
     * @param isValueEditorShown whether the value editor is shown and active
     */
    onChange?: (resourceName: string|null, isValueEditorShown: boolean) => void;
}

/**
 * A component that is used as editor for an input of some workflow step, e.g. operation.
 *
 * @author Norman Fomferra
 */
export class InputEditor extends React.PureComponent<IInputEditorProps, null> {
    constructor(props: IInputEditorProps) {
        super(props);
    }

    private handleChange(resourceName: string, isValueEditorShown: boolean) {
        console.log('InputEditor: handleChange', resourceName, isValueEditorShown);
        if (this.props.onChange) {
            this.props.onChange(resourceName, isValueEditorShown);
        }
    }

    render() {

        let editor;
        if (this.isValueEditorShown()) {
            editor = this.props.valueEditor;
        } else {
            editor = this.renderResourceNameEditor();
        }

        const editorSwitch = this.renderEditorSwitch();
        return (
            <div key={this.props.name} style={{display: 'flex', alignItems: 'center', padding: '0.1em'}}>
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

    private renderResourceNameEditor() {
        const NULL_VALUE = '__null__';
        const firstResourceOption = (<option key='__first__' value={NULL_VALUE}>Select resource</option>);
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
        return (
            <div className="pt-select pt-intent-primary">
                <select value={this.props.resourceName || NULL_VALUE}
                        disabled={otherResourceOptions.length == 0}
                        onChange={(event:any) => this.handleChange(event.target.value === NULL_VALUE ? null : event.target.value, false)}>
                    {resourceOptions}
                </select>
            </div>
        );
    }

    private renderEditorSwitch() {
        const valueEditorShown = this.isValueEditorShown();
        const valueEditorDisabled = this.isValueEditorDisabled();
        return (
            <div>
                <Tooltip
                    content={(valueEditorShown ? "Switch to resource selection" : "Switch to value entry") + (valueEditorDisabled ? ' (disabled)' : '')}>
                    <Switch checked={valueEditorShown}
                            disabled={valueEditorDisabled}
                            style={{marginLeft: '1em', marginBottom: 0}}
                            onChange={(event:any) => this.handleChange(this.props.resourceName, event.target.checked)}/>
                </Tooltip>
            </div>
        );
    }

    private isDataTypeCompatible(resource) {
        return isAssignableFrom(this.props.dataType, resource.dataType);
    }

    private isValueEditorDisabled() {
        return !this.props.valueEditor;
    }

    private isValueEditorShown() {
        return !!(this.props.isValueEditorShown && this.props.valueEditor);
    }
}


/**
 * Naive test if a targetDataType is assignable from a given sourceDataType.
 */
function isAssignableFrom(targetDataType: string, sourceDataType: string) {
    if (targetDataType === sourceDataType) {
        return true;
    }
    switch (targetDataType) {
        case 'object':
            return true;
        case 'bool':
            return true;
        case 'int':
            return sourceDataType === 'bool';
        case 'float':
            return sourceDataType === 'bool' || sourceDataType === 'int';
        case 'numpy.ndarray':
            return sourceDataType === 'xarray.core.dataarray.DataArray';
        case 'pandas.core.frame.DataFrame':
            return sourceDataType === 'geopandas.geodataframe.GeoDataFrame';
        case 'pandas.core.series.Series':
            return sourceDataType === 'geopandas.geoseries.GeoSeries';
        case 'cate.core.types.TimeRangeLike':
            return sourceDataType === 'str';
        case 'cate.core.types.PointLike':
            // TODO (forman): add shapely Point
            return sourceDataType === 'str';
        case 'cate.core.types.PolygonLike':
            // TODO (forman): add shapely Polygon
            return sourceDataType === 'str';
        case 'cate.core.types.GeometryLike':
            // TODO (forman): add shapely Point, Polygon, Geometry, ...
            return sourceDataType === 'str'
                || sourceDataType === 'cate.core.types.PointLike'
                || sourceDataType === 'cate.core.types.PolygonLike';
    }
    return false;
}


