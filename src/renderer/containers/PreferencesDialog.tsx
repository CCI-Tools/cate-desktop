import * as React from 'react';
import {Dialog, Classes, Button} from "@blueprintjs/core";
import {State, SessionState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import {TextField} from "../components/TextField";

interface IPreferencesDialogProps {
    dispatch?: any;
    isOpen: boolean;
    preferences: SessionState;
}

function mapStateToProps(state: State): IPreferencesDialogProps {
    let dialogState = state.control.dialogs[PreferencesDialog.DIALOG_ID];
    return {
        isOpen: dialogState && dialogState.isOpen,
        preferences: state.session,
    };
}

class PreferencesDialog extends React.Component<IPreferencesDialogProps, SessionState> {
    static readonly DIALOG_ID = 'preferencesDialog';

    constructor(props: IPreferencesDialogProps) {
        super(props);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.state = props.preferences;
    }

    private handleConfirm() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    private handleCancel() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate(nextProps: IPreferencesDialogProps, nextState: SessionState) {
        return this.props.isOpen !== nextProps.isOpen || this.state !== nextState;
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
                {this.renderDialogBody()}
                {this.renderDialogFooter()}
            </Dialog>
        );
    }

    private renderDialogFooter() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button className="pt-intent-primary"
                            onClick={this.handleConfirm}
                    >OK</Button>
                </div>
            </div>
        );
    }

    private renderDialogBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_BODY}>
                {this.renderDataStoresPath()}
                {this.renderResourceNamePrefix()}
            </div>
        );
    }

    private renderResourceNamePrefix() {
        const onChange = (resourceNamePrefix: string) => {
            this.setState({resourceNamePrefix} as SessionState);
        };
        const resourceNamePrefix = this.state.resourceNamePrefix;
        return (
            <div className="pt-control-group" style={{width: '100%', marginBottom:'1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexGrow: 0.8}}>Resource name prefix:</span>
                <TextField className="pt-input"
                           style={{flexGrow: 0.2}}
                           value={resourceNamePrefix}
                           onChange={onChange}
                />
            </div>
        );
    }

    private renderDataStoresPath() {
        const onChange = (dataStoresPath: string) => {
            const backendConfig = {dataStoresPath};
            console.log(backendConfig);
            this.setState({backendConfig} as SessionState);
        };
        const dirPath = this.state.backendConfig.dataStoresPath || '';
        return (
            <div style={{width: '100%', marginBottom:'1em'}}>
                <p>Data stores synchronisation directory:</p>
                <div className="pt-control-group" style={{display: 'flex', alignItems: 'center'}}>
                    <TextField className="pt-input"
                               style={{flexGrow: 1}}
                               value={dirPath}
                               placeholder="Enter local directory path"
                               onChange={onChange}
                    />
                    <Button className="pt-intent-primary" style={{flex: 'none'}}
                            onClick={() => PreferencesDialog.showOpenDirectoryDialog(dirPath, onChange)}>...</Button>
                </div>
            </div>
        );
    }


    private static showOpenDirectoryDialog(value: string, onChange: (value) => void) {
        const openDialogOptions = {
            title: "Select Directory",
            defaultPath: value,
            buttonLabel: "Select",
            properties: ["openDirectory"],
            filter: [],
        };
        actions.showFileOpenDialog(openDialogOptions, (filePaths: string[]) => {
            if (filePaths && filePaths.length) {
                onChange(filePaths[0]);
            }
        });
    }
}

export default connect(mapStateToProps)(PreferencesDialog);
