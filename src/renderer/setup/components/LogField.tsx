import * as React from "react";
import {TextLine} from "../../../common/terminal-output";

export interface ILogFieldProps {
    lines: TextLine[];
}

export class LogField extends React.PureComponent<ILogFieldProps> {

    private static STYLE: React.CSSProperties = {
        overflow: "auto",
        background: "#464646",
        color: "#FFFFEE",
        fontFamily: ["Source Code Pro", "Consolas", "Lucida Console", "Courier New"],
        fontSize: "0.9em",
        width: "100%",
        height: 248,
        padding: 3,
    };

    terminal?: HTMLDivElement;

    constructor(props: ILogFieldProps) {
        super(props);
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.terminal) {
            this.terminal.scrollIntoView({behavior: "smooth"});
        }
    }

    render() {
        return (
            <div style={LogField.STYLE}>
                {this.props.lines.map((text, index) => <Line key={index} text={text}/>)}
                <div ref={ref => this.terminal = ref}/>
            </div>
        );
    }
}

interface ILineProps {
    text: string;
}

function Line(props: ILineProps) {
    return (<div>{props.text}<br/></div>);
}
