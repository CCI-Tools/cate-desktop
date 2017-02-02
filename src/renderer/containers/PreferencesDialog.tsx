import * as React from 'react';
import {Dialog, Classes, Button} from "@blueprintjs/core";
import {State} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";

interface IPreferencesDialogProps {
    dispatch?: any;
    isOpen: boolean;
}

function mapStateToProps(state: State): IPreferencesDialogProps {
    let dialogState = state.control.dialogs[PreferencesDialog.DIALOG_ID];
    return {
        isOpen: dialogState && dialogState.isOpen,
    };
}

class PreferencesDialog extends React.Component<IPreferencesDialogProps, null> {
    static readonly DIALOG_ID = 'preferencesDialog';

    constructor(props: IPreferencesDialogProps) {
        super(props);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    private handleConfirm() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    private handleCancel() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate(nextProps: IPreferencesDialogProps) {
        return this.props.isOpen != nextProps.isOpen;
    }

    render() {
        return (
            <Dialog
                isOpen={this.props.isOpen}
                iconName="confirm"
                onClose={this.handleCancel}
                title="Preferences"
                autoFocus={true}
                canEscapeKeyClose={true}
                canOutsideClickClose={true}
                enforceFocus={true}
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>TODO: preferences go here...</p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Button className="pt-intent-primary"
                                onClick={this.handleConfirm}
                        >OK</Button>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default connect(mapStateToProps)(PreferencesDialog);
