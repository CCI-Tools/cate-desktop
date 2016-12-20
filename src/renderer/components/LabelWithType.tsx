import * as React from "react";

export interface ILabelWithTypeProps {
    label: string;
    dataType: string;
}

/**
 * A label with a data type.
 *
 * @author Norman Fomferra
 */
export function LabelWithType(props: ILabelWithTypeProps) {
    return (<span>{props.label} <span style={{color: 'rgba(0,255,0,0.8)', fontSize: '0.8em'}}>{props.dataType}</span></span>);
}

