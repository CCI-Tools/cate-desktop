import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Classes, Button, Dialog, IconName, Intent, ProgressBar, Icon } from '@blueprintjs/core';
import { State, WebAPIStatus } from '../state';
import * as actions from '../actions';


interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IWebAPIStatusBoxProps {
    webAPIStatus: WebAPIStatus;
}

function mapStateToProps(state: State): IWebAPIStatusBoxProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
    };
}

const _WebAPIStatusBox: React.FC<IWebAPIStatusBoxProps & IDispatch> = (props) => {
    switch (props.webAPIStatus) {
        case 'login':
            return (<AlertBox
                message={'Logging in...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'launching':
            return (<AlertBox
                message={'Launching Cate service instance...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'connecting':
            return (<AlertBox
                message={'Connecting to Cate service instance...'}
                icon="log-in"
                isWaiting={true}
            />);
        case 'logoff':
            return (<AlertBox
                message={'Closing Cate service instance...'}
                icon="log-out"
                isWaiting={true}
            />);
        case 'closed':
        case 'error':
            return (<AlertBox
                message={'Oops! The connection to the Cate service has been closed unexpectedly.'}
                icon="offline"
                isWaiting={false}
                onRetry={() => props.dispatch(actions.connectWebAPIClient())}
                onCancel={() => props.dispatch(actions.setWebAPIStatus(null))}
            />);
        default:
            return null;
    }
};

const WebAPIStatusBox = connect(mapStateToProps)(_WebAPIStatusBox);
export default WebAPIStatusBox;

interface IAlertBoxProps {
    message: string;
    icon: IconName;
    isWaiting: boolean;
    onRetry?: () => void;
    onCancel?: () => void;
}

const AlertBox: React.FC<IAlertBoxProps> = ({
                                                message,
                                                icon,
                                                isWaiting,
                                                onRetry,
                                                onCancel,
                                            }) => {

    let progress;
    if (isWaiting) {
        progress = (<p><ProgressBar intent={Intent.SUCCESS}/></p>);
    }
    let footer;
    if (onRetry || onCancel) {
        let cancelButton = onCancel ? (<Button onClick={onCancel} intent={Intent.PRIMARY}>Cancel</Button>) : null;
        let retryButton = onRetry ? (<Button onClick={onRetry}>Retry</Button>) : null;
        footer = (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    {cancelButton}
                    {retryButton}
                </div>
            </div>
        );
    }
    return (
        <Dialog
            isOpen={true}
            canEscapeKeyClose={false}
            canOutsideClickClose={false}
        >
            <div className={Classes.DIALOG_BODY}>
                <p><Icon icon={icon} iconSize={32}/></p>
                <p>{message}</p>
                {progress}
            </div>
            {footer}
        </Dialog>
    );
};
