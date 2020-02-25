import * as React from 'react';
import { MplFigureCommandListener, MplFigureCommandSourceImpl } from './MplFigure';
import { MplFigureContainer } from './MplFigureContainer';
import { ButtonGroup, Tag } from '@blueprintjs/core';
import { CSSProperties } from 'react';
import { ToolButton } from '../ToolButton';


interface IFigurePanelProps {
    id: string;
    figureId: number;
    figureUpdateCount: number;
    figureName: string;
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
export class MplFigurePanel extends React.Component<IFigurePanelProps, IFigurePanelState> {
    static readonly DIV_STYLE: CSSProperties = {width: '100%', overflow: 'auto'};
    static readonly CONTAINER_DIV_STYLE: CSSProperties = {
        width: '100%',
        overflow: 'hidden',
        padding: '0.2em 0.2em 0 0.2em'
    };

    constructor(props: IFigurePanelProps) {
        super(props);
        this.state = {};
        this.handleFigureMessage = this.handleFigureMessage.bind(this);
    }

    // TODO (forman): inform MplFigurePanel if view is closed!
    static handleClose(figureId: number) {
        FIGURE_COMMAND_SOURCE.removeCommandListeners(figureId);
    }

    handleFigureMessage(message: string) {
        this.setState({message});
    }

    render() {
        return (
            <div style={MplFigurePanel.DIV_STYLE}>
                <MplFigureContainer figureId={this.props.figureId}
                                    figureUpdateCount={this.props.figureUpdateCount}
                                    figureHeight={this.props.figureHeight || '30em'}
                                    id={this.props.id}
                                    debug={false}
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

interface IMplFigureToolbarProps {
    figureId: number;
    message: string;
    onCommand: MplFigureCommandListener;
    onDownload: MplFigureCommandListener;
}

class MplFigureToolbar extends React.PureComponent<IMplFigureToolbarProps, null> {

    static readonly DIV_STYLE: CSSProperties = {display: 'flex', alignItems: 'center', padding: '0.2em'};

    commands: any[];

    constructor(props: IMplFigureToolbarProps) {
        super(props);

        this.commands = [
            {
                label: 'Home',
                tooltip: 'Reset original view',
                icon: 'home',
                name: 'home',
            },
            {
                label: 'Back',
                tooltip: 'Back to  previous view',
                icon: 'chevron-left',
                name: 'back',
            },
            {
                label: 'Forward',
                tooltip: 'Forward to next view',
                icon: 'chevron-right',
                name: 'forward',
            },
            {
                label: 'Pan',
                tooltip: 'Pan axes with left mouse, zoom with right',
                icon: 'move',
                name: 'pan',
            },
            {
                label: 'Zoom',
                tooltip: 'Zoom to rectangle',
                icon: 'zoom-in',
                name: 'zoom',
            },
            {
                label: 'Save As',
                tooltip: 'Save as image',
                icon: 'download',
                name: 'download',
            }
        ];

        for (let command of this.commands) {
            const name = command['name'];
            let callback;
            if (name === 'download') {
                callback = () => {
                    // console.log(`MplFigureToolbar: "${name}" clicked for figure #${this.props.figureId}!`);
                    this.props.onDownload(this.props.figureId, {name});
                };
            } else {
                callback = () => {
                    // console.log(`MplFigureToolbar: "${name}" clicked for figure #${this.props.figureId}!`);
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
                const icon = command['icon'];
                const onClick = command['callback'];
                buttons.push(
                    <ToolButton key={i}
                                tooltipContent={tooltipText}
                                icon={icon}
                                onClick={onClick}/>
                );
            }
        }

        let messageTag;
        if (this.props.message) {
            messageTag = (<Tag className="bp3-minimal">{this.props.message}</Tag>);
        }

        return (
            <div style={MplFigureToolbar.DIV_STYLE}>
                {messageTag}
                <span style={{flex: 'auto'}}/>
                <ButtonGroup >{buttons}</ButtonGroup >
            </div>
        );
    }
}

