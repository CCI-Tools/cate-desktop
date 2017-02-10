import * as React from 'react';
import {Dialog, Classes, Button, TabPanel, Tab, TabList, Tabs, Switch} from "@blueprintjs/core";
import {State, SessionState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import {TextField} from "../components/TextField";
import {OpenDialogProperty} from "../actions";
import * as deepEqual from 'deep-equal';

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
    static readonly DIALOG_TITLE = 'Preferences';

    constructor(props: IPreferencesDialogProps) {
        super(props);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.state = props.preferences;
    }

    componentWillReceiveProps(nextProps: IPreferencesDialogProps) {
        this.setState(nextProps.preferences);
    }

    private handleConfirm() {
        this.props.dispatch(actions.hidePreferencesDialog());
        if (!deepEqual(this.props.preferences, this.state)) {
            const backendConfig = this.state.backendConfig;
            const backendChangesDetected = !deepEqual(this.props.preferences.backendConfig, backendConfig);
            this.props.dispatch(actions.applyPreferences(this.state));
            if (backendChangesDetected) {
                this.props.dispatch(actions.storeBackendConfig(backendConfig));
                this.props.dispatch(actions.showMessageBox({
                    title: PreferencesDialog.DIALOG_TITLE,
                    message: "Some changes will be effective only after restart."
                }));
            }
        } else {
            this.props.dispatch(actions.showMessageBox({
                title: PreferencesDialog.DIALOG_TITLE,
                message: "No changes detected."
            }));
        }
    }

    private handleCancel() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    render() {
        return (
            <Dialog
                isOpen={this.props.isOpen}
                iconName="confirm"
                onClose={this.handleCancel}
                title={PreferencesDialog.DIALOG_TITLE}
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
                <Tabs>
                    <TabList>
                        <Tab>Data Management</Tab>
                        <Tab>Miscellaneous</Tab>
                    </TabList>
                    <TabPanel>
                        {this.renderDataManagementPanel()}
                    </TabPanel>
                    <TabPanel>
                        {this.renderMiscellaneousPanel()}
                    </TabPanel>
                </Tabs>
            </div>
        );
    }

    private renderDataManagementPanel() {
        return (
            <div style={{width: '100%', marginTop:'1em'}}>
                {this.renderDataStoresPath()}
                {this.renderCacheWorkspaceImagery()}
            </div>
        );
    }

    private renderDataStoresPath() {
        const onChange = (dataStoresPath: string) => {
            this.setBackendConfig({dataStoresPath});
        };
        const dataStoresPath = this.state.backendConfig.dataStoresPath || '';
        return (
            <div style={{width: '100%', marginBottom:'1em'}}>
                <p>Data stores synchronisation directory:</p>
                <div className="pt-control-group" style={{display: 'flex', alignItems: 'center'}}>
                    <TextField className="pt-input"
                               style={{flexGrow: 1}}
                               value={dataStoresPath}
                               placeholder="Enter local directory path"
                               onChange={onChange}
                    />
                    <Button className="pt-intent-primary" style={{flex: 'none'}}
                            onClick={() => PreferencesDialog.showOpenDirectoryDialog(dataStoresPath, onChange)}>...</Button>
                </div>
            </div>
        );
    }

    private renderCacheWorkspaceImagery() {
        const onChange = (useWorkspaceImageryCache: boolean) => {
            this.setBackendConfig({useWorkspaceImageryCache});
        };
        const useWorkspaceImageryCache = this.state.backendConfig.useWorkspaceImageryCache;
        return (
            <div style={{width: '100%', marginBottom:'1em'}}>
                <Switch checked={useWorkspaceImageryCache}
                        label="Cache workspace imagery for faster image display"
                        onChange={(event: any) => onChange(event.target.checked)} />
            </div>
        );
    }

    private renderMiscellaneousPanel() {
        return (
            <div style={{width: '100%', marginTop:'1em'}}>
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

    private static showOpenDirectoryDialog(defaultPath: string, onChange: (value) => void) {
        const openDialogOptions = {
            title: "Select Directory",
            defaultPath: defaultPath,
            buttonLabel: "Select",
            properties: [
                'openDirectory' as OpenDialogProperty,
                'createDirectory' as OpenDialogProperty,
                'promptToCreate' as OpenDialogProperty,
            ],
            filter: [],
        };
        actions.showSingleFileOpenDialog(openDialogOptions, (dirPath: string) => {
            if (dirPath) {
                onChange(dirPath);
            }
        });
    }

    private setBackendConfig(backendConfigDelta: any) {
        const backendConfig = Object.assign({}, this.state.backendConfig, backendConfigDelta);
        this.setState({backendConfig} as SessionState);
    }
}

export default connect(mapStateToProps)(PreferencesDialog);



