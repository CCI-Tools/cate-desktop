import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import * as actions from '../actions';
import { Button, InputGroup, Intent } from '@blueprintjs/core';
import { State } from '../state';
import { CSSProperties } from 'react';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IAppLoginPageProps {
    username: string;
    password: string;
}

function mapStateToProps(state: State): IAppLoginPageProps {
    return {
        username: state.communication.username,
        password: state.communication.password,
    };
}

class _AppLoginPage extends React.PureComponent<IAppLoginPageProps & IDispatch, null> {
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
        alignItems: 'center'
    };

    render() {
        const password = this.props.password;
        const username = this.props.username;

        const login = () => {
            this.props.dispatch(actions.login());
        };

        const setUsername = (username: string) => {
            this.props.dispatch(actions.setUserCredentials(username, password));
        };

        const setPassword = (password: string) => {
            this.props.dispatch(actions.setUserCredentials(username, password));
        };

        const hasCredentials = !!(username && password);

        return (
            <div style={_AppLoginPage.CENTER_DIV_STYLE}>
                <div style={_AppLoginPage.BOX_STYLE}>
                    <h4>CateHub Login</h4>

                    {/*<div style={{marginTop: 24, alignContent: 'center', textAlign: 'center', display: 'flex'}}>*/}
                    {/*<img width={32} height={32} src={'resources/images/github-120.png'} alt={'github icon'}/>*/}
                    {/*<span>&nbsp;&nbsp;&nbsp;</span>*/}
                    {/*<Button onClick={signIn} intent={Intent.PRIMARY} className={'pt-large'}>Using your GitHub*/}
                    {/*Account</Button>*/}
                    {/*</div>*/}
                    {/*<h4 style={{marginTop: 24}}>or</h4>*/}
                    {/*<p style={{marginTop: 24, alignSelf: 'center'}}>Using your CateHub Account</p>*/}

                    <div style={{marginTop: 12, alignSelf: 'stretch', width: '20em'}}>
                        <InputGroup
                            className={'pt-large'}
                            placeholder="Enter your username..."
                            type={'text'}
                            leftIconName={'user'}
                            value={username || ''}
                            onChange={(event) => setUsername(event.target.value)}
                        />
                    </div>
                    <div style={{marginTop: 6, alignSelf: 'stretch', width: '20em'}}>
                        <InputGroup
                            className={'pt-large'}
                            placeholder="Enter your password..."
                            type={'password'}
                            leftIconName={'key'}
                            value={password || ''}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    <div style={{marginTop: 6, alignSelf: 'flex-end'}}>
                        <Button
                            className={'pt-large'}
                            intent={Intent.PRIMARY}
                            onClick={login}
                            disabled={!hasCredentials}>Login</Button>
                    </div>
                    <div style={{marginTop: 12, alignSelf: 'center'}}>
                        <span>Don't have an account yet?&nbsp;</span><a href={'https://github.com/login'}>Apply!</a>
                    </div>
                </div>
            </div>
        );
    }
}

const AppLoginPage = connect(mapStateToProps)(_AppLoginPage);
export default AppLoginPage;
