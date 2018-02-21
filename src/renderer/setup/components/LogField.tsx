import * as React from "react";
import {TextElement} from "./terminal-output";

export interface ILogFieldProps {
    textElements: TextElement[];
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

        // TODO (nf) avoid recreation of elements by using a state cache
        const lines = [];
        let i = 0;
        for (let textElement of this.props.textElements) {
            const text = textElement[0];
            if (text === "\n") {
                lines.push(<br key={i}/>);
            } else {
                lines.push(<span key={i}>{text}</span>);
            }
            i++;
        }

        return (<div style={LogField.STYLE}>{lines}</div>);
    }
}
