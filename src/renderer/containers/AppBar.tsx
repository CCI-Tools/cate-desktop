import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
    Button,
    Menu,
    MenuDivider,
    MenuItem,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    Popover,
    Position
} from '@blueprintjs/core';
import * as actions from '../actions';
import { State } from '../state';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppBarProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppBarProps {
    return {};
}

class _AppBar extends React.PureComponent<IAppBarProps & IDispatch, null> {

    handlePreferencesClick = () => {
        this.props.dispatch(actions.showPreferencesDialog());
    };

    // TODO (forman): implement drop down menus
    render() {
        return (
            <Navbar>
                <NavbarGroup><span className="pt-ui-text-large">Cate - CCI Toolbox</span></NavbarGroup>
                <NavbarGroup align="right">
                    <Popover content={<WorkspacesMenu/>} position={Position.BOTTOM}>
                        <Button className="pt-minimal">Workspaces</Button>
                    </Popover>
                    <NavbarDivider/>
                    <Button className="pt-minimal" icon="log-out">Logout</Button>
                    <NavbarDivider/>
                    <Button className="pt-minimal" icon='cog' onClick={this.handlePreferencesClick}/>
                </NavbarGroup>
            </Navbar>
        );
    }
}

const AppBar = connect(mapStateToProps)(_AppBar);
export default AppBar;

interface WorkspacesMenuProps {
}

const WorkspacesMenu = (props: WorkspacesMenuProps) => {
    const handleClick = () => {
    };
    return (
        <Menu>
            <MenuItem
                icon="folder-new"
                onClick={handleClick}
                text="New Workspace"
            />
            <MenuItem
                icon="folder-shared-open"
                onClick={handleClick}
                text="Open Workspace"
            />
            <MenuItem
                icon="folder-close"
                onClick={handleClick}
                text="Close Workspace"
            />
            <MenuDivider/>
            <MenuItem
                icon="add-to-folder"
                onClick={handleClick}
                text="Save Workspace"
            />
            <MenuItem
                onClick={handleClick}
                text="Save Workspace As..."
            />
            <MenuDivider/>
            <MenuItem
                icon="trash"
                onClick={handleClick}
                text="Delete Workspace"
            />
        </Menu>
    );
};
