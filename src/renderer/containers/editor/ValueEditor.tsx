import * as React from 'react';
import * as types from "../../../common/cate-types";
import {OperationInputState, ResourceState} from "../../state";
import {FieldValue} from "../../components/field/Field";
import {BooleanValueEditor} from "./BooleanValueEditor";
import {IntegerValueEditor} from "./IntegerValueEditor";
import {FloatValueEditor} from "./FloatValueEditor";
import {TextValueEditor} from "./TextValueEditor";
import {FileValueEditor} from "./FileValueEditor";
import {GeometryValueEditor} from "./GeometryValueEditor";
import {TimeRangeValueEditor} from "./TimeRangeValueEditor";
import {VarNameValueEditor} from "./VarNameValueEditor";
import {DimNameValueEditor} from "./DimNameValueEditor";
import {DictValueEditor} from "./DictValueEditor";
import {LiteralValueEditor} from "./LiteralValueEditor";
import {TimeValueEditor} from "./TimeValueEditor";
import {ScriptValueEditor} from "./ScriptValueEditor";
import {InputAssignments} from "./value-editor-assign";

export type ValueEditorValue<T> = FieldValue<T> | T | null;
export type ValueEditorCallback<T> = (input: OperationInputState, value: ValueEditorValue<T>) => void;

export type GeometryWKTGetter = (() => string) | null;

export interface IValueEditorProps<T> {
    input: OperationInputState;
    value: ValueEditorValue<T>;
    onChange: ValueEditorCallback<T>;
    inputAssignments?: InputAssignments;
    resources?: ResourceState[];
    geometryWKTGetter?: GeometryWKTGetter;
}

export type ValueEditorFactory<T> = (props: IValueEditorProps<T>) => JSX.Element | null;

/**
 * Provides an appropriate value editor widget for the given input (OperationInputState).
 */
export function ValueEditor(props: IValueEditorProps<any>) {
    return renderValueEditor(props);
}

/**
 * Provides an appropriate value editor widget for the given input (OperationInputState).
 */
export function renderValueEditor<T>(props: IValueEditorProps<T>) {
    const factory = getValueEditorFactory(props.input.dataType);
    return factory ? factory(props) : null;
}

export function hasValueEditorFactory(dataType: string): boolean {
    return !!getValueEditorFactory(dataType);
}

export function getValueEditorFactory(dataType: string): ValueEditorFactory<any> {
    return dataType ? VALUE_EDITOR_FACTORIES[dataType] : null;
}

//noinspection JSUnusedGlobalSymbols
export function registerValueEditorFactory(dataType: string, factory: ValueEditorFactory<any>) {
    VALUE_EDITOR_FACTORIES[dataType] = factory;
}

///////////////////////////////////////////////////////////////////////////////////////

function renderBoolValueEditor(props: IValueEditorProps<boolean>) {
    return <BooleanValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderIntValueEditor(props: IValueEditorProps<number>) {
    return <IntegerValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderFloatValueEditor(props: IValueEditorProps<number>) {
    return <FloatValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderStrValueEditor(props: IValueEditorProps<string>) {
    if (props.input.fileOpenMode) {
        return renderFileValueEditor(props);
    } else if (props.input.scriptLang) {
        return renderScriptValueEditor(props);
    } else {
        return renderTextValueEditor(props);
    }
}

function renderFileValueEditor(props: IValueEditorProps<string>) {
    return <FileValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderScriptValueEditor(props: IValueEditorProps<string>) {
    return <ScriptValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderTextValueEditor(props: IValueEditorProps<string>) {
    return <TextValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderPointLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange} geometryType="Point"
                                size={16} geometryWKTGetter={props.geometryWKTGetter}/>;
}

function renderPolygonLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange} geometryType="Polygon"
                                size={32} geometryWKTGetter={props.geometryWKTGetter}/>;
}

function renderGeometryLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange}
                                geometryType="Geometry" size={32} geometryWKTGetter={props.geometryWKTGetter}/>;
}

function renderTimeLikeValueEditor(props: IValueEditorProps<string>) {
    return <TimeValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderTimeRangeLikeValueEditor(props: IValueEditorProps<string>) {
    return <TimeRangeValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderVarNameLikeValueEditor(props: IValueEditorProps<string>) {
    return <VarNameValueEditor input={props.input} value={props.value} onChange={props.onChange}
                               resource={findResource(props)} multi={false}/>;
}

function renderVarNamesLikeValueEditor(props: IValueEditorProps<string>) {
    return <VarNameValueEditor input={props.input} value={props.value} onChange={props.onChange}
                               resource={findResource(props)} multi={true}/>;
}

function renderDimNameLikeValueEditor(props: IValueEditorProps<string>) {
    return <DimNameValueEditor input={props.input} value={props.value} onChange={props.onChange}
                               variable={findVariable(props)} multi={false}/>;
}

function renderDimNamesLikeValueEditor(props: IValueEditorProps<string>) {
    return <DimNameValueEditor input={props.input} value={props.value} onChange={props.onChange}
                               variable={findVariable(props)} multi={true}/>;
}

function renderDictLikeValueEditor(props: IValueEditorProps<string>) {
    return <DictValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderLiteralValueEditor(props: IValueEditorProps<string>) {
    return <LiteralValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

const VALUE_EDITOR_FACTORIES = {
    [types.BOOL_TYPE]: renderBoolValueEditor,
    [types.INT_TYPE]: renderIntValueEditor,
    [types.FLOAT_TYPE]: renderFloatValueEditor,
    [types.STR_TYPE]: renderStrValueEditor,
    [types.POINT_LIKE_TYPE]: renderPointLikeValueEditor,
    [types.POLYGON_LIKE_TYPE]: renderPolygonLikeValueEditor,
    [types.GEOMETRY_LIKE_TYPE]: renderGeometryLikeValueEditor,
    [types.TIME_LIKE_TYPE]: renderTimeLikeValueEditor,
    [types.TIME_RANGE_LIKE_TYPE]: renderTimeRangeLikeValueEditor,
    [types.VAR_NAME_LIKE_TYPE]: renderVarNameLikeValueEditor,
    [types.VAR_NAMES_LIKE_TYPE]: renderVarNamesLikeValueEditor,
    [types.DIM_NAME_LIKE_TYPE]: renderDimNameLikeValueEditor,
    [types.DIM_NAMES_LIKE_TYPE]: renderDimNamesLikeValueEditor,
    [types.DICT_LIKE_TYPE]: renderDictLikeValueEditor,
    [types.FILE_LIKE_TYPE]: renderFileValueEditor,
    [types.LITERAL_TYPE]: renderLiteralValueEditor,
};

///////////////////////////////////////////////////////////////////////////////////////


function findResource(props: IValueEditorProps<any>) {
    const valueSetSource = props.input.valueSetSource;
    const resources = props.resources;
    const inputAssignments = props.inputAssignments;
    let resource;
    if (valueSetSource && resources && inputAssignments) {
        const inputAssignment = inputAssignments[valueSetSource];
        const resourceName = inputAssignment.resourceName;
        if (inputAssignment && resourceName && !inputAssignment.isValueUsed) {
            resource = resources.find(r => r.name === resourceName);
        }
    }
    return resource;
}


function findVariable(props: IValueEditorProps<any>) {
    const valueSetSource = props.input.valueSetSource.split(".");
    const resources = props.resources;
    const inputAssignments = props.inputAssignments;

    let resource;
    let variable;

    if (valueSetSource[0] && resources && inputAssignments) {
        const inputAssignment = inputAssignments[valueSetSource[0]];
        const resourceName = inputAssignment.resourceName;
        if (inputAssignment && resourceName && !inputAssignment.isValueUsed) {
            resource = resources.find(r => r.name === resourceName);
        }
    }

    if (resource) {
        const variables = resource.variables;
        if (valueSetSource[1] && variables && inputAssignments) {
            const inputAssignment = inputAssignments[valueSetSource[1]];
            if (inputAssignment && inputAssignment.constantValue) {
                const varName = inputAssignment.constantValue.textValue;
                variable = variables.find(v => v.name === varName);
            }

        }
    }

    return variable;
}

