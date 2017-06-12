import * as React from 'react';
import {MplFigureCommandListener, MplFigureCommandSourceImpl} from './MplFigure';
import {MplFigureContainer} from './MplFigureContainer';
import {Button, Tag, Tooltip} from "@blueprintjs/core";


interface IFigurePanelProps {
    id: string;
    figureName: string;
    figureId: number;
    figureHeight?: any;
    webSocketUrl: string;
    onDownload: MplFigureCommandListener;
}

interface IFigurePanelState {
    message?: string;
}

const FIGURE_COMMAND_SOURCE = new MplFigureCommandSourceImpl();


/**
 * A component that wraps a div that holds a matplotlib figure.
 *
 * @author Norman Fomferra
 */
export class MplFigurePanel extends React.PureComponent<IFigurePanelProps, IFigurePanelState> {
    static readonly DIV_STYLE = {width: '100%', overflow: 'hidden'};
    static readonly CONTAINER_DIV_STYLE = {width: '100%', overflow: 'hidden'};

    constructor(props: IFigurePanelProps) {
        super(props);
        this.state = {};
        this.handleFigureMessage = this.handleFigureMessage.bind(this);
    }

    static handleClose(figureId: number) {
        FIGURE_COMMAND_SOURCE.removeCommandListeners(figureId);
    }

    handleFigureMessage(message: string) {
        this.setState({message});
    }

    render() {
        return (
            <div style={MplFigurePanel.DIV_STYLE}>
                <MplFigureHeader figureId={this.props.figureId}
                                 title={`${this.props.figureName} (#${this.props.figureId})`}
                                 onClose={MplFigurePanel.handleClose}/>
                <MplFigureContainer figureId={this.props.figureId}
                                    figureHeight={this.props.figureHeight || '25em'}
                                    id={this.props.id}
                                    webSocketUrl={this.props.webSocketUrl}
                                    style={MplFigurePanel.CONTAINER_DIV_STYLE}
                                    commandSource={FIGURE_COMMAND_SOURCE}
                                    onMessage={this.handleFigureMessage}/>
                <MplFigureToolbar figureId={this.props.figureId}
                                  message={this.state.message}
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

    static readonly DIV_STYLE = {display: "flex", padding: '0.2em'};

    constructor(props: IMplFigureHeaderProps) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
    }

    handleClose() {
        this.props.onClose(this.props.figureId);
    }

    render() {
        return (
            <div style={MplFigureHeader.DIV_STYLE}>
                <span style={{flex: "auto"}}>{this.props.title}</span>
                <Button style={{flex: "none"}} iconName="small-cross" onClick={this.handleClose}/>
            </div>
        );
    }
}

interface IMplFigureToolbarProps {
    figureId: number;
    message: string;
    onCommand: MplFigureCommandListener;
    onDownload: MplFigureCommandListener;
}

class MplFigureToolbar extends React.PureComponent<IMplFigureToolbarProps, null> {

    static readonly DIV_STYLE = {display: 'flex', alignItems: 'center', padding: 2};

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
            }
        }

        return (
            <div style={MplFigureToolbar.DIV_STYLE}>
                <Tag className="pt-minimal">{this.props.message}</Tag>
                <span style={{flex: 'auto'}}/>
                <div className="pt-button-group" >{buttons}</div>
            </div>
        );
    }
}

