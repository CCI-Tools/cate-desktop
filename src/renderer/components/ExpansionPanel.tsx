import * as React from "react"
import {Menu, MenuItem, MenuDivider, Popover, Position, Collapse} from "@blueprintjs/core";
import * as classNames from "classnames";
import {Splitter} from "./Splitter";

/**
 * {@link ExpansionPanel} properties.
 */
interface IExpansionPanelProps {
    icon?: string;
    text: string;
    isOpen?: boolean;
    onOpen?: () => any;
    onClose?: () => any;
    isExpanded?: boolean;
    onExpand?: () => any;
    onCollapse?: () => any;
    isFocused?: boolean;
    onFocusGained?: () => any;
    onFocusLost?: () => any;
    defaultHeight?: number | string | null;
    height?: number;
}

/**
 * {@link ExpansionPanel} state.
 */
interface IExpansionPanelState {
    isOpen: boolean;
    isExpanded: boolean;
    isFocused: boolean;
    isMoreActive: boolean;
    width?: number;
    height?: number;
}

/**
 * Expansion panels contain creation flows and allow lightweight editing of an element.
 * The permanentObject comprises a panel header and blueprint's `Collapse` permanentObject which holds the content of the
 * panel.
 * See https://material.google.com/components/expansion-panels.html.
 *
 * @author Norman Fomferra
 */
export class ExpansionPanel extends React.Component<IExpansionPanelProps,IExpansionPanelState> {
    constructor(props: IExpansionPanelProps) {
        super(props);
        this.state = {
            isOpen: props.isOpen !== false,
            isExpanded: props.isExpanded || false,
            isFocused: props.isFocused || false,
            isMoreActive: false,
            height: props.height,
        };
        this.handlePanelHeaderClicked = this.handlePanelHeaderClicked.bind(this);
        this.handleMoreButtonClicked = this.handleMoreButtonClicked.bind(this);
        this.handleExpandButtonClicked = this.handleExpandButtonClicked.bind(this);
        this.handleCloseButtonClicked = this.handleCloseButtonClicked.bind(this);
    }

    private handlePanelHeaderClicked() {
        this.setState({
            isFocused: false,
            // isFocused: true,
        } as IExpansionPanelState);
    }

    private handleMoreButtonClicked() {
        this.setState({
            isMoreActive: !this.state.isMoreActive
        } as IExpansionPanelState);
    }

    private handleExpandButtonClicked() {
        this.setState({
            isExpanded: !this.state.isExpanded,
            // isFocused: this.state.isExpanded ? this.state.isFocused : true,
        } as IExpansionPanelState);
    }

    private handleCloseButtonClicked() {
        this.setState({
            isOpen: false,
            isFocused: false,
        }as IExpansionPanelState);
    }

    private static fireChange(oldState: boolean, newState: boolean, onTrue: () => any, onFalse: () => any) {
        if (oldState !== newState) {
            if (newState) {
                if (onTrue) onTrue();
            } else {
                if (onFalse) onFalse();
            }
        }
    }

    componentWillUpdate(nextProps: IExpansionPanelState, nextState: IExpansionPanelState): void {
        ExpansionPanel.fireChange(this.state.isFocused, nextState.isFocused,
            this.props.onFocusGained, this.props.onFocusLost);
        ExpansionPanel.fireChange(this.state.isOpen, nextState.isOpen,
            this.props.onOpen, this.props.onClose);
        ExpansionPanel.fireChange(this.state.isExpanded, nextState.isExpanded,
            this.props.onExpand, this.props.onCollapse);
    }

    handleSplitterDelta(deltaY: number) {
        this.setState((state, props) => {
            let newHeight: number = (state.height || 0) + deltaY;
            if (newHeight < 0) {
                newHeight = 0;
            }
            // console.log('handleSplitterDelta: newHeight: ', newHeight, this);
            const newState: any = {height: newHeight};
            return newState as IExpansionPanelState;
        });
    }

    handleContentPaneRef(contentPane: HTMLDivElement) {
        if (contentPane) {
            const initialWidth = contentPane.clientWidth;
            const initialHeight = contentPane.clientHeight;
            if (this.state.width != initialWidth || this.state.height != initialHeight) {
                const newState: any = {
                    width: initialWidth,
                    height: initialHeight
                };
                this.setState(newState as IExpansionPanelState);
            }
        }
    }

    render(): JSX.Element {
        /*
        const menu = (
            <Menu>
                <MenuItem iconName="graph" text="Graph"/>
                <MenuItem iconName="map" text="Map"/>
                <MenuItem iconName="th" text="Table" shouldDismissPopover={false}/>
                <MenuItem iconName="zoom-to-fit" text="Nucleus" disabled={true}/>
                <MenuDivider />
                <MenuItem iconName="cog" text="Settings...">
                    <MenuItem iconName="add" text="Add new application" disabled={true}/>
                    <MenuItem iconName="remove" text="Remove application"/>
                </MenuItem>
            </Menu>
        );
        */

        const panelClassNames = classNames("cate-panel", {
            'opened': this.state.isOpen,
            'closed': !this.state.isOpen,
        });

        // const menuIconName = "pt-icon-properties";
        const expandIconName = this.state.isExpanded ? "pt-icon-chevron-up" : "pt-icon-chevron-down";
        const closeIconName = "pt-icon-cross";

        let icon = null;
        if (this.props.icon) {
            const iconClasses = classNames("pt-icon-standard", this.props.icon, {"cate-panel-selected": this.state.isFocused});
            icon = <span className={iconClasses} onClick={this.handlePanelHeaderClicked}/>;
        }
        const textClasses = classNames("cate-panel-text", {"cate-panel-selected": this.state.isFocused});
        const text = <span className={textClasses} onClick={this.handlePanelHeaderClicked}>{this.props.text.toUpperCase()}</span>;

        /*
        const menuIcon = (
            <Popover isOpen={this.state.isMoreActive} content={menu}>
                <span className={"pt-icon-standard " + menuIconName + " cate-icon-small"}
                      onClick={this.handleMoreButtonClicked}/>
            </Popover>);
        */
        const expandIcon = (<span className={"pt-icon-standard " + expandIconName + " cate-icon-small"}
                                  onClick={this.handleExpandButtonClicked}/>);
        const closeIcon = (<span className={"pt-icon-standard " + closeIconName + " cate-icon-small"}
                                 onClick={this.handleCloseButtonClicked}/>);

        const contentPaneStyle = {width: '100%', paddingTop: 4, paddingBottom: 4};
        let contentPaneHeight;
        if (this.state.height) {
            contentPaneHeight = this.state.height;
        } else if (this.props.defaultHeight) {
            contentPaneHeight = this.props.defaultHeight;
        }
        if (contentPaneHeight) {
            contentPaneStyle['height'] = contentPaneHeight;
        }

        // console.log(`${this.props.text}'s content pane size: ${this.state.width} x ${this.state.height}`);

        return (
            <div className={panelClassNames}>
                <div className="cate-panel-header">
                    {icon}
                    {text}
                    {/*menuIcon*/}
                    {expandIcon}
                    {closeIcon}
                </div>
                <Collapse isOpen={this.state.isExpanded}>
                    <div ref={this.handleContentPaneRef.bind(this)} style={contentPaneStyle}>
                        {this.state.isExpanded ? this.props.children : null}
                    </div>
                    <Splitter direction='ver' onChange={this.handleSplitterDelta.bind(this)}/>
                </Collapse>
            </div>
        );
    }
}
