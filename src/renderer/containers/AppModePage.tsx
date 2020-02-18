import * as React from 'react';
import { CSSProperties } from 'react';
import { connect, Dispatch } from 'react-redux';
import * as actions from '../actions';
import { Button, Checkbox, Intent } from '@blueprintjs/core';
import { State } from '../state';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppModePageProps {
}

// noinspection JSUnusedLocalSymbols
function mapStateToProps(state: State): IAppModePageProps {
    return {};
}

class _AppModePage extends React.PureComponent<IAppModePageProps & IDispatch, null> {
    static readonly CENTER_DIV_STYLE: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    };
    static readonly BOX_STYLE: CSSProperties = {
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: 'stretch'
    };

    render() {

        const setLocalMode = () => {
            this.props.dispatch(actions.setWebAPIMode('local'));
        };

        const setRemoteMode = () => {
            this.props.dispatch(actions.setWebAPIMode('remote'));
        };

        const setRememberMyDecision = () => {
            // TODO (forman): implement me!
        };

        return (
            <div style={_AppModePage.CENTER_DIV_STYLE}>
                <div style={_AppModePage.BOX_STYLE}>
                    <div style={{alignContent: 'center', textAlign: 'center'}}>
                        <img src={'resources/cate-icon@8x.png'} alt={'cate icon'}/>
                    </div>
                    <Button className={'pt-large'} intent={Intent.PRIMARY} style={{marginTop: 12}}
                            onClick={setRemoteMode}>Connect to
                        CateHub</Button>
                    <Button className={'pt-large'} intent={Intent.NONE} style={{marginTop: 6}}
                            onClick={setLocalMode}>Stand-Alone
                        Mode</Button>
                    <div style={{marginTop: 6}}>
                        <Checkbox checked={true} onChange={setRememberMyDecision}>Remember my decision</Checkbox>
                    </div>
                </div>
            </div>
        );
    }
}

const AppModePage = connect(mapStateToProps)(_AppModePage);
export default AppModePage;

