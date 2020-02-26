import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Classes, Button, Dialog, IconName, Intent, ProgressBar } from '@blueprintjs/core';
import { State, WebAPIStatus } from '../state';

// import * as actions from '../actions';


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
            return <AlertBox
                message={'Logging in...'}
                icon="log-in"
                intent={Intent.PRIMARY}
            />;
        case 'launching':
            return <AlertBox
                message={'Launching Cate service instance...'}
                icon="globe-network"
                intent={Intent.PRIMARY}
            />;
        case 'connecting':
            return <AlertBox
                message={'Connecting to Cate service instance...'}
                icon="globe-network"
                intent={Intent.PRIMARY}
            />;
        case 'logoff':
            return <AlertBox
                message={'Closing Cate service instance...'}
                icon="log-out"
                intent={Intent.PRIMARY}
            />;
        default:
            return null;
    }
};

const WebAPIStatusBox = connect(mapStateToProps)(_WebAPIStatusBox);
export default WebAPIStatusBox;

interface IAlertBoxProps {
    message: string;
    icon?: IconName;
    intent?: Intent;
    onConfirm?: () => void;
    onCancel?: () => void;
}

const AlertBox: React.FC<IAlertBoxProps> = ({
                                                message,
                                                onConfirm,
                                                onCancel,
                                                icon,
                                                intent
                                            }) => {

    let cancelControl;
    if (onCancel) {
        cancelControl = (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={this.handleClose}>Cancel</Button>
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
                <p>{message}</p>
                <p><ProgressBar intent={intent}/></p>
            </div>
            {cancelControl}
        </Dialog>
    );
};
