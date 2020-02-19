import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Button, Navbar, NavbarDivider, NavbarGroup } from '@blueprintjs/core';
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
    // TODO (forman): implement drop down menus
    render() {
        return (
            <Navbar>
                <NavbarGroup><span className="pt-ui-text-large">Cate - CCI Toolbox</span></NavbarGroup>
                <NavbarGroup align="right">
                    <Button className="pt-minimal" iconName="document">Workspaces</Button>
                    <NavbarDivider/>
                    <Button className="pt-minimal" iconName='user'/>
                    <Button className="pt-minimal" iconName='cog'/>
                </NavbarGroup>
            </Navbar>
        );
    }
}

const AppBar = connect(mapStateToProps)(_AppBar);
export default AppBar;

