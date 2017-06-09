import * as React from 'react';
import {MplFigure, MplFigureCommandData, MplFigureCommandListener, MplFigureCommandSourceImpl} from './MplFigure';
import {MplFigureContainer} from './MplFigureContainer';
import {Button, Tooltip} from "@blueprintjs/core";


interface IFigurePanelProps {
    id: string;
    figureName: string;
    figureId: number;
    webSocketUrl: string;
    onDownload: MplFigureCommandListener;
}

const FIGURE_COMMAND_SOURCE = new MplFigureCommandSourceImpl();


/**
 * A component that wraps a div that holds a matplotlib figure.
 *
 * @author Norman Fomferra
 */
export class MplFigurePanel extends React.PureComponent<IFigurePanelProps, null> {
    static readonly DIV_STYLE = {width: '100%'};

    static handleCommand(figureId: number, commandData: MplFigureCommandData) {
        FIGURE_COMMAND_SOURCE.dispatchCommand(figureId, commandData);
    }

    static handleClose(figureId: number) {
        FIGURE_COMMAND_SOURCE.removeCommandListeners(figureId);
    }

    render() {
        return (
            <div style={MplFigurePanel.DIV_STYLE}>
                <MplFigureHeader figureId={this.props.figureId}
                                 title={`${this.props.figureName} (#${this.props.figureId})`}
                                 onClose={MplFigurePanel.handleClose}/>
                <MplFigureContainer figureId={this.props.figureId}
                                    id={this.props.id}
                                    webSocketUrl={this.props.webSocketUrl}
                                    style={{width: '100%', height: 'calc(100% - 2em - 2em', overflow: 'auto'}}
                                    commandSource={FIGURE_COMMAND_SOURCE}/>
                <MplFigureToolbar figureId={this.props.figureId}
                                  onCommand={FIGURE_COMMAND_SOURCE.dispatchCommand}
                                  onDownload={this.props.onDownload}/>
            </div>
        );
    }
}

interface IMplFigureHeaderProps {
    title: string;
    figureId: number;
    onClose: (figureId: number) => any;
}

class MplFigureHeader extends React.PureComponent<IMplFigureHeaderProps, null> {
    constructor(props: IMplFigureHeaderProps) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
    }

    handleClose() {
        this.props.onClose(this.props.figureId);
    }

    render() {
        return (
            <div style={{height: '2em'}}>
                <span>{this.props.title}</span>
                <Button iconName="small-cross" onClick={this.handleClose}/>
            </div>
        );
    }
}

interface IMplFigureToolbarProps {
    figureId: number;
    onCommand: MplFigureCommandListener;
    onDownload: MplFigureCommandListener;
}

class MplFigureToolbar extends React.PureComponent<IMplFigureToolbarProps, null> {

    commands: any[];

    constructor(props: IMplFigureToolbarProps) {
        super(props);

        this.commands = [
            {
                label: "Home",
                tooltip: "Reset original view",
                icon: "home",
                name: "home",
            },
            {
                label: "Back",
                tooltip: "Back to  previous view",
                icon: "chevron-left",
                name: "back",
            },
            {
                label: "Forward",
                tooltip: "Forward to next view",
                icon: "chevron-right",
                name: "forward",
            },
            {},
            {
                label: "Pan",
                tooltip: "Pan axes with left mouse, zoom with right",
                icon: "move",
                name: "pan",
            },
            {
                label: "Zoom",
                tooltip: "Zoom to rectangle",
                icon: "zoom-in",
                name: "zoom",
            },
            {},
            {
                label: "Download",
                tooltip: "Download plot",
                icon: "download",
                name: "download",
            }
        ];

        for (let command of this.commands) {
            const name = command['name'];
            let callback;
            if (name === 'download') {
                callback = () => {
                    console.log(`MplFigureToolbar: "${name}" clicked for figure #${this.props.figureId}!`);
                    this.props.onDownload(this.props.figureId, {name});
                };
            } else {
                callback = () => {
                    console.log(`MplFigureToolbar: "${name}" clicked for figure #${this.props.figureId}!`);
                    this.props.onCommand(this.props.figureId, {name});
                };
            }
            command['callback'] = callback;
        }
    }

    render() {
        const buttons = [];
        for (let i in this.commands) {
            const command = this.commands[i];
            const name = command['name'];
            if (name) {
                const tooltipText = command['tooltip'];
                const iconName = command['icon'];
                const onClick = command['callback'];
                buttons.push(
                    <Tooltip key={i} content={tooltipText}>
                        <Button iconName={iconName} onClick={onClick}/>
                    </Tooltip>
                );
            } else {
                buttons.push(
                    <span key={i}>&nbsp;&nbsp;</span>
                );
            }
        }

        return (<div className="pt-button-group pt-minimal" style={{height: '2em'}}>{buttons}</div>);
    }
}

