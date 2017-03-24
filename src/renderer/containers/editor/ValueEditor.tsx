import * as React from 'react';
import {DateRange} from "@blueprintjs/datetime";
import {OperationInputState} from "../../state";
import {FieldValue} from "../../components/field/Field";
import {BooleanValueEditor} from "./BooleanValueEditor";
import {IntegerValueEditor} from "./IntegerValueEditor";
import {FloatValueEditor} from "./FloatValueEditor";
import {TextValueEditor} from "./TextValueEditor";
import {PolygonValueEditor} from "./PolygonValueEditor";
import {FileValueEditor} from "./FileValueEditor";
import {PointValueEditor} from "./PointValueEditor";
import {TimeRangeValueEditor} from "./TimeRangeValueEditor";
import * as types from "../../../common/cate-types";
import {VarNamesValueEditor} from "./VarNamesValueEditor";


export type ValueEditorValue<T> = FieldValue<T> | T | null;
export type ValueEditorCallback<T> = (input: OperationInputState, value: ValueEditorValue<T>) => void;
export type ValueEditorFactory<T> = (input: OperationInputState,
                                     value: ValueEditorValue<T>,
                                     onChange: ValueEditorCallback<T>) => JSX.Element | null;

export interface IValueEditorProps<T> {
    input: OperationInputState;
    value: ValueEditorValue<T>;
    onChange: ValueEditorCallback<T>;
}

/**
 * Provides an appropriate value editor widget for the given input (OperationInputState).
 */
export function ValueEditor(props: IValueEditorProps<any>) {
    return renderValueEditor(props.input, props.value, props.onChange);
}

/**
 * Provides an appropriate value editor widget for the given input (OperationInputState).
 */
export function renderValueEditor<T>(input: OperationInputState,
                                     value: ValueEditorValue<T>,
                                     onChange: ValueEditorCallback<T>) {
    const factory = getValueEditorFactory(input.dataType);
    return factory ? factory(input, value, onChange) : null;
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

function renderBoolValueEditor(input: OperationInputState,
                               value: ValueEditorValue<boolean>,
                               onChange: ValueEditorCallback<boolean>) {
    return <BooleanValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderIntValueEditor(input: OperationInputState,
                              value: ValueEditorValue<number>,
                              onChange: ValueEditorCallback<number>) {
    return <IntegerValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderFloatValueEditor(input: OperationInputState,
                                value: ValueEditorValue<number>,
                                onChange: ValueEditorCallback<number>) {
    return <FloatValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderStrValueEditor(input: OperationInputState,
                              value: ValueEditorValue<string>,
                              onChange: ValueEditorCallback<string>) {
    if (input.fileOpenMode) {
        return <FileValueEditor input={input} value={value} onChange={onChange}/>;
    } else {
        return <TextValueEditor input={input} value={value} onChange={onChange}/>;
    }
}

function renderPointLikeValueEditor(input: OperationInputState,
                                    value: ValueEditorValue<string>,
                                    onChange: ValueEditorCallback<string>) {
    return <PointValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderPolygonLikeValueEditor(input: OperationInputState,
                                      value: ValueEditorValue<string>,
                                      onChange: ValueEditorCallback<string>) {
    return <PolygonValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderTimeRangeLikeValueEditor(input: OperationInputState,
                                        value: ValueEditorValue<string>,
                                        onChange: ValueEditorCallback<string>) {
    return <TimeRangeValueEditor input={input} value={value} onChange={onChange}/>;
}

function renderVarNamesLikeValueEditor(input: OperationInputState,
                                       value: ValueEditorValue<string>,
                                       onChange: ValueEditorCallback<string>) {
    return <VarNamesValueEditor input={input} value={value} onChange={onChange}/>;
}

const VALUE_EDITOR_FACTORIES = {
    [types.BOOL_TYPE]: renderBoolValueEditor,
    [types.INT_TYPE]: renderIntValueEditor,
    [types.FLOAT_TYPE]: renderFloatValueEditor,
    [types.STR_TYPE]: renderStrValueEditor,
    [types.POINT_LIKE_TYPE]: renderPointLikeValueEditor,
    [types.POLYGON_LIKE_TYPE]: renderPolygonLikeValueEditor,
    [types.TIME_RANGE_LIKE_TYPE]: renderTimeRangeLikeValueEditor,
    [types.VAR_NAMES_LIKE_TYPE]: renderVarNamesLikeValueEditor,
};

///////////////////////////////////////////////////////////////////////////////////////
