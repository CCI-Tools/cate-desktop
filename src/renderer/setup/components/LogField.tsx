import * as React from 'react';
import { TextLine } from '../../../common/terminal-output';

export interface ILogFieldProps {
    lines: TextLine[];
    footerMessage?: string;
    footerColor?: string;
}

export class LogField extends React.PureComponent<ILogFieldProps> {

    private static STYLE: React.CSSProperties = {
        overflow: 'auto',
        background: '#464646',
        color: '#FFFFEE',
        fontFamily: '"Source Code Pro", Consolas, "Lucida Console", "Courier New"',
        fontSize: '0.9em',
        width: '100%',
        minHeight: 48,
        flex: '1 1 auto',
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
            this.terminal.scrollIntoView({behavior: 'smooth'});
        }
    }

    render() {

        let footerMessage;
        if (this.props.footerMessage) {
            footerMessage = <div style={{color: this.props.footerColor}}>{`\n${this.props.footerMessage}\n`}</div>;
        }

        return (
            <pre style={LogField.STYLE}>
                {this.props.lines.map((text, index) => <Line key={index} text={text}/>)}
                {footerMessage}
                <div ref={ref => this.terminal = ref}/>
            </pre>
        );
    }
}

interface ILineProps {
    text: string;
}

function Line(props: ILineProps) {
    return (<div>{props.text}<br/></div>);
}
