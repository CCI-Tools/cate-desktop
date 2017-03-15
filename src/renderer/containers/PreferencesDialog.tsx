import * as React from 'react';
import {Button, TabPanel, Tab, TabList, Tabs, Switch} from "@blueprintjs/core";
import {State, SessionState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {TextField} from "../components/TextField";
import {OpenDialogProperty} from "../actions";
import * as deepEqual from 'deep-equal';
import {ModalDialog} from "../components/ModalDialog";

interface IPreferencesDialogProps {
    dispatch?: any;
    isOpen: boolean;
    preferences: SessionState;
}

function mapStateToProps(state: State): IPreferencesDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(PreferencesDialog.DIALOG_ID)(state).isOpen,
        preferences: state.session,
    };
}


class PreferencesDialog extends React.Component<IPreferencesDialogProps, SessionState> {
    static readonly DIALOG_ID = 'preferencesDialog';
    static readonly DIALOG_TITLE = 'Preferences';

    constructor(props: IPreferencesDialogProps) {
        super(props);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = props.preferences;
    }

    componentWillReceiveProps(nextProps: IPreferencesDialogProps) {
        this.setState(nextProps.preferences);
    }

    private onConfirm() {
        this.props.dispatch(actions.hidePreferencesDialog());
        if (!deepEqual(this.props.preferences, this.state)) {
            const backendConfig = this.state.backendConfig;
            const backendChangesDetected = !deepEqual(this.props.preferences.backendConfig, backendConfig);
            this.props.dispatch(actions.updatePreferences(this.state));
            if (backendChangesDetected) {
                this.props.dispatch(actions.storeBackendConfig(backendConfig));
                actions.showMessageBox({
                    title: PreferencesDialog.DIALOG_TITLE,
                    message: "Some changes will be effective only after restart."
                });
            }
        } else {
            actions.showMessageBox({
                title: PreferencesDialog.DIALOG_TITLE,
                message: "No changes detected."
            });
        }
    }

    private onCancel() {
        this.props.dispatch(actions.hidePreferencesDialog());
    }

    //noinspection JSMethodCanBeStatic
    private canConfirm() {
        // TODO (forman): add validation of preferences changes
        return true;
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={PreferencesDialog.DIALOG_TITLE}
                iconName="confirm"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        return (
            <Tabs>
                <TabList>
                    <Tab>General</Tab>
                    <Tab>Data Management</Tab>
                </TabList>
                <TabPanel>
                    {this.renderGeneralPanel()}
                </TabPanel>
                <TabPanel>
                    {this.renderDataManagementPanel()}
                </TabPanel>
            </Tabs>
        );
    }

    private renderGeneralPanel() {
        return (
            <div style={{width: '100%', marginTop:'1em'}}>
                {this.renderReopenLastWorkspace()}
                {this.renderResourceNamePrefix()}
                {this.renderOfflineMode()}
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

    private renderReopenLastWorkspace() {
        return this.renderBooleanValue(
            'reopenLastWorkspace',
            false,
            "Reopen last workspace on startup"
        );
    }

    private renderResourceNamePrefix() {
        return this.renderStringValue(
            'resourceNamePrefix',
            false,
            'Resource name prefix'
        );
    }

    private renderOfflineMode() {
        return this.renderBooleanValue(
            'offlineMode',
            false,
            "Force offline mode (requires restart)"
        );
    }

    private renderDataStoresPath() {
        return this.renderDirectoryPath(
            'dataStoresPath',
            true,
            'Synchronisation directory for remote data store files'
        );
    }

    private renderCacheWorkspaceImagery() {
        return this.renderBooleanValue(
            'useWorkspaceImageryCache',
            true,
            "Use per-workspace imagery cache (may accelerate image display)"
        );
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Components
    // Note (forman): could make this React component later

    private renderDirectoryPath(propertyName, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom:'1em'}}>
                <p>{label}:</p>
                <div className="pt-control-group" style={{display: 'flex', alignItems: 'center'}}>
                    <TextField className="pt-input"
                               style={{flexGrow: 1}}
                               value={initialValue}
                               placeholder="Enter local directory path"
                               onChange={onChange}
                    />
                    <Button className="pt-intent-primary" style={{flex: 'none'}}
                            onClick={() => PreferencesDialog.showOpenDirectoryDialog(initialValue, onChange)}>...</Button>
                </div>
            </div>
        );
    }

    private renderStringValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div className="pt-control-group"
                 style={{width: '100%', marginBottom:'1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexGrow: 0.8}}>{label}:</span>
                <TextField className="pt-input"
                           style={{flexGrow: 0.2}}
                           value={initialValue}
                           onChange={onChange}
                />
            </div>
        );
    }

    private renderBooleanValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom:'1em'}}>
                <Switch checked={initialValue}
                        label={label}
                        onChange={(event: any) => onChange(event.target.checked)}/>
            </div>
        );
    }

    private getChangeHandler(propertyName: string, isBackend: boolean) {
        return (value: any) => {
            const change = {};
            change[propertyName] = value;
            console.log('getChangeHandler', propertyName, isBackend, change);
            if (isBackend) {
                this.setBackendConfig(change);
            } else {
                this.setState(change as SessionState);
            }
        };
    }

    private getStateValue(propertyName: string, isBackend: boolean) {
        return isBackend ? this.state.backendConfig[propertyName] : this.state[propertyName];
    }

    private setBackendConfig(backendConfigDelta: any) {
        const backendConfig = Object.assign({}, this.state.backendConfig, backendConfigDelta);
        this.setState({backendConfig} as SessionState);
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
}

export default connect(mapStateToProps)(PreferencesDialog);



