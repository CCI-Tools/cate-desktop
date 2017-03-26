import * as React from 'react';
import {OperationInputState, ResourceState} from "../../state";
import {FieldValue} from "../../components/field/Field";
import {BooleanValueEditor} from "./BooleanValueEditor";
import {IntegerValueEditor} from "./IntegerValueEditor";
import {FloatValueEditor} from "./FloatValueEditor";
import {TextValueEditor} from "./TextValueEditor";
import {FileValueEditor} from "./FileValueEditor";
import {GeometryValueEditor} from "./GeometryValueEditor";
import {TimeRangeValueEditor} from "./TimeRangeValueEditor";
import {VarNamesValueEditor} from "./VarNamesValueEditor";
import * as types from "../../../common/cate-types";

export interface InputAssignment {
    constantValue: FieldValue<any> | any;
    resourceName: string;
    isValueUsed: boolean;
}

export type InputAssignments = { [inputName: string]: InputAssignment };

export type ValueEditorValue<T> = FieldValue<T> | T | null;
export type ValueEditorCallback<T> = (input: OperationInputState, value: ValueEditorValue<T>) => void;

export interface IValueEditorProps<T> {
    input: OperationInputState;
    value: ValueEditorValue<T>;
    onChange: ValueEditorCallback<T>;
    inputAssignments?: InputAssignments;
    resources?: ResourceState[];
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
        return <FileValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
    } else {
        return <TextValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
    }
}

function renderPointLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange} geometryType="Point" fieldSize={16}/>;
}

function renderPolygonLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange} geometryType="Polygon" fieldSize={32}/>;
}

function renderGeometryLikeValueEditor(props: IValueEditorProps<string>) {
    return <GeometryValueEditor input={props.input} value={props.value} onChange={props.onChange} geometryType="Geometry" fieldSize={32}/>;
}

function renderTimeRangeLikeValueEditor(props: IValueEditorProps<string>) {
    return <TimeRangeValueEditor input={props.input} value={props.value} onChange={props.onChange}/>;
}

function renderVarNamesLikeValueEditor(props: IValueEditorProps<string>) {
    return <VarNamesValueEditor input={props.input} value={props.value} onChange={props.onChange} resource={findResource(props)}/>;
}

const VALUE_EDITOR_FACTORIES = {
    [types.BOOL_TYPE]: renderBoolValueEditor,
    [types.INT_TYPE]: renderIntValueEditor,
    [types.FLOAT_TYPE]: renderFloatValueEditor,
    [types.STR_TYPE]: renderStrValueEditor,
    [types.POINT_LIKE_TYPE]: renderPointLikeValueEditor,
    [types.POLYGON_LIKE_TYPE]: renderPolygonLikeValueEditor,
    [types.GEOMETRY_LIKE_TYPE]: renderGeometryLikeValueEditor,
    [types.TIME_RANGE_LIKE_TYPE]: renderTimeRangeLikeValueEditor,
    [types.VAR_NAMES_LIKE_TYPE]: renderVarNamesLikeValueEditor,
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

