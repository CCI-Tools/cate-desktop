import * as React from 'react'
import ReactChild = React.ReactChild;
import {Tooltip, MenuItem, MenuDivider, Menu, PopoverInteractionKind, Popover} from "@blueprintjs/core";


export interface IPanelBarProps {
    onChange?: (newPanelId: string|null, oldPanelId: string|null) => void;
    selectedPanelId?: string|null;
    position?: "left"|"right";
}

export interface IPanelBarState {
    selectedPanelId?: string|null;
}

/**
 * A PanelContainer comprises Panels.
 *
 * @author Norman Fomferra
 */
export class PanelContainer extends React.PureComponent<IPanelBarProps, IPanelBarState> {
    constructor(props: IPanelBarProps) {
        super(props);
        this.selectPanel = this.selectPanel.bind(this);
        this.state = {selectedPanelId: props.selectedPanelId};
    }

    componentWillReceiveProps(props: IPanelBarProps) {
        this.setState({selectedPanelId: props.selectedPanelId});
    }

    private selectPanel(panelId: string) {
        let oldPanelId = this.state.selectedPanelId;
        const newPanelId = panelId === oldPanelId ? null : panelId;
        console.log("selectPanel: ", newPanelId, oldPanelId);
        this.setState({selectedPanelId: newPanelId}, () => {
            if (this.props.onChange) {
                this.props.onChange(this.state.selectedPanelId, oldPanelId);
            }
        });
    }

    render() {
        const panels: JSX.Element[] = this.props.children as any;
        if (panels && typeof panels.length === 'undefined') {
            return null;
        }

        const selectedPanelId = this.state.selectedPanelId;
        let selectedPanel: JSX.Element|null = null;

        const panelButtons: JSX.Element[] = [];

        for (let panel of panels) {
            console.log('panel: ', panel);
            if (!panel.props) {
                console.error('PanelContainer children must be of type Panel');
                continue;
            }
            const panelId: string = panel.props.id;
            const panelTitle: string = panel.props.title;
            const panelIconName: string = panel.props.iconName;
            if (!panelId || !panelTitle || !panelIconName) {
                console.error('PanelContainer children must have valid id, title, iconName properties');
                continue;
            }
            const selected = panelId === selectedPanelId;
            const className = selected ? 'cate-selected' : null;
            if (selected) {
                selectedPanel = panel;
            }
            panelButtons.push(
                <li key={panelId}
                    onClick={() => this.selectPanel(panelId)}
                    className={className}>
                    <Tooltip content={panelTitle}>
                        <span className={"pt-icon-large " + panelIconName} style={{minWidth: "24px", minHeight: "24px"}}/>
                    </Tooltip>
                </li>
            );
        }

        let panelHeader = null;
        let panelBody = null;
        if (selectedPanel) {
            panelHeader = (
                <PanelHeader
                    id={selectedPanel.props.id}
                    title={selectedPanel.props.title}
                    iconName={selectedPanel.props.iconName}
                    onClose={() => this.selectPanel(selectedPanel.props.id)}
                />);
            panelBody = selectedPanel.props.body;
        }

        const position = this.props.position || "left";
        let panelContainerStyle = {display: "flex", alignItems: "stretch"};
        let panelBarStyle = {flex: "none", minWidth: "20px"};
        let panelParentStyle = {flex: "auto", display: "flex", flexDirection: "column", alignItems: "stretch"};
        if (position === "left") {
            panelContainerStyle = {...panelContainerStyle, flexDirection: "row", justifyContent: "flex-start"};
            panelBarStyle = {...panelBarStyle, order: 0};
            panelParentStyle = {...panelParentStyle, order: 1};
        } else {
            panelContainerStyle = {...panelContainerStyle, flexDirection: "row-reverse", justifyContent: "flex-end"};
            panelBarStyle = {...panelBarStyle, order: 1};
            panelParentStyle = {...panelParentStyle, order: 0};
        }

        const panelBar = (
            <ul className="cate-panel-bar" style={panelBarStyle}>
                {panelButtons}
            </ul>
        );

        return (
            <div style={panelContainerStyle}>
                {panelBar}
                <div style={panelParentStyle}>
                    {panelHeader}
                    {panelBody}
                </div>
            </div>
        );
    }
}


interface IPanelHeaderProps {
    id: string;
    iconName: string;
    title: string;
    onClose: () => void;
}

function PanelHeader(props: IPanelHeaderProps): JSX.Element|null {
    const panelIcon = <span
        className={"pt-icon-standard " + props.iconName + " cate-panel-header-item"}/>;
    const panelTitle = <span
        className={"cate-panel-text cate-panel-header-item"}>{props.title.toUpperCase()}</span>;

    const panelMenu = (
        <Menu>
            <MenuItem text="Move up"/>
            <MenuItem text="Move down"/>
            <MenuDivider />
            <MenuItem text="Hide"/>
        </Menu>
    );

    const panelMenuIcon = (
        <Popover content={panelMenu} interactionKind={PopoverInteractionKind.CLICK}>
            <span className={"pt-icon-standard pt-icon-properties cate-icon-small cate-panel-header-item"}/>
        </Popover>
    );
    const panelCloseIcon = (
        <span className={"pt-icon-standard pt-icon-cross cate-icon-small cate-panel-header-item"}
              onClick={props.onClose}/>);

    return (
        <div className="cate-panel-header" style={{flex: "none"}}>
            {panelIcon}
            {panelTitle}
            {panelMenuIcon}
            {panelCloseIcon}
        </div>
    );
}

