import * as React from "react";
import {TextLine} from "../../../common/terminal-output";

export interface ILogFieldProps {
    textElements: TextLine[];
}

export class LogField extends React.PureComponent<ILogFieldProps> {

    private static STYLE: React.CSSProperties = {
        overflow: "auto",
        background: "#262626",
        color: "#FFFFDF",
        fontFamily: "sans",
        width: "100%",
        height: "100%",
    };

    constructor(props: ILogFieldProps) {
        super(props);
    }

    render() {
        return (<div style={LogField.STYLE}>{this.props.textElements}</div>);
    }
}
