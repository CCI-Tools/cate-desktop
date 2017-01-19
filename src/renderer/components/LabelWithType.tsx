import * as React from "react";
import {Tooltip} from "@blueprintjs/core";

export interface ILabelWithTypeProps {
    label: string;
    dataType: string;
    units?: string;
    tooltipText?: string;
    style?: {[cssProperty: string]: any;}
}

/**
 * A label with a data type and optional units and tooltip text.
 *
 * @author Norman Fomferra
 */
export function LabelWithType(props: ILabelWithTypeProps) {

    const labelText = props.label;
    const dataTypeText = props.dataType;
    const unitsText = props.units && props.units !== '' ? ` (${props.units})` : '';

    let content = (
        <span>{labelText} {unitsText} <span style={{color: 'rgba(0,255,0,0.8)', fontSize: '0.8em'}}>{dataTypeText} </span></span>
    );

    if (props.tooltipText && props.tooltipText !== '') {
        content = (<Tooltip content={props.tooltipText}>{content}</Tooltip>);
    }

    return <div style={props.style}>{content}</div>;
}

