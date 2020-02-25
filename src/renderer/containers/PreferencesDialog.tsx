import * as React from 'react';
import { AnchorButton, Switch, Tabs, Tab, Intent, ControlGroup } from '@blueprintjs/core';
import { State, SessionState } from '../state';
import { connect, DispatchProp } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { TextField } from '../components/field/TextField';
import { OpenDialogProperty, showMessageBox } from '../actions';
import deepEqual from 'deep-equal';
import { ModalDialog } from '../components/ModalDialog';
import { showToast } from '../toast';
import { isDefined } from '../../common/types';

interface IPreferencesDialogProps {
    isOpen: boolean;
    preferences: SessionState;
}

function mapStateToProps(state: State): IPreferencesDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(PreferencesDialog.DIALOG_ID)(state).isOpen,
        preferences: state.session,
    };
}


class PreferencesDialog extends React.Component<IPreferencesDialogProps & DispatchProp<State>, SessionState> {
    static readonly DIALOG_ID = 'preferencesDialog';
    static readonly DIALOG_TITLE = 'Preferences';

    constructor(props: IPreferencesDialogProps & DispatchProp<State>) {
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
            const autoUpdateSoftwareChangeDetected = this.props.preferences.autoUpdateSoftware !== this.state.autoUpdateSoftware;
            const backendChangesDetected = !deepEqual(this.props.preferences.backendConfig, backendConfig);
            this.props.dispatch(actions.updatePreferences(this.state) as any);
            if (autoUpdateSoftwareChangeDetected || backendChangesDetected) {
                this.props.dispatch(actions.storeBackendConfig(backendConfig) as any);
                showMessageBox({
                                   type: 'info',
                                   title: PreferencesDialog.DIALOG_TITLE,
                                   message: 'Some changes will be effective only after restart.'
                               });
            }
        } else {
            showToast({
                          type: 'info',
                          text: 'No changes detected.'
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
                icon="confirm"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        return (
            <Tabs id="preferences">
                <Tab id="g" title="General" panel={this.renderGeneralPanel()}/>
                <Tab id="dm" title="Data Management" panel={this.renderDataManagementPanel()}/>
                <Tab id="pc" title="Proxy Configuration" panel={this.renderProxyConfigurationPanel()}/>
            </Tabs>
        );
    }

    private renderGeneralPanel() {
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {this.renderReopenLastWorkspace()}
                {this.renderAutoUpdates()}
                {this.renderAutoShowNewFigures()}
                {this.renderOfflineMode()}
                {this.renderPanelContainerUndockedMode()}
            </div>
        );
    }

    private renderDataManagementPanel() {
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {this.renderDataStoresPath()}
                {this.renderCacheWorkspaceImagery()}
                {this.renderResourceNamePrefix()}
            </div>
        );
    }

    private renderProxyConfigurationPanel() {
        return (
            <div style={{width: '100%', marginTop: '1em'}}>
                {this.renderProxyUrlInput()}
            </div>
        );
    }

    private renderReopenLastWorkspace() {
        return this.renderBooleanValue(
            'reopenLastWorkspace',
            false,
            'Reopen last workspace on startup'
        );
    }

    private renderAutoUpdates() {
        return this.renderBooleanValue(
            'autoUpdateSoftware',
            false,
            'Automatic software updates'
        );
    }

    private renderAutoShowNewFigures() {
        return this.renderBooleanValue(
            'autoShowNewFigures',
            false,
            'Open plot view for new Figure resources'
        );
    }

    private renderOfflineMode() {
        return this.renderBooleanValue(
            'offlineMode',
            false,
            'Force offline mode (requires restart)'
        );
    }

    private renderPanelContainerUndockedMode() {
        return this.renderBooleanValue(
            'panelContainerUndockedMode',
            false,
            'Undocked tool panels (experimental)'
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
            'Use per-workspace imagery cache (may accelerate image display)'
        );
    }

    private renderResourceNamePrefix() {
        return this.renderStringValue(
            'resourceNamePattern',
            true,
            'Default resource name pattern'
        );
    }

    private renderProxyUrlInput() {
        const initialValue = this.getStateValue('proxyUrl', true);
        const onChange = this.getChangeHandler('proxyUrl', true);
        return (
            <ControlGroup style={{width: '100%', marginBottom: '1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexBasis: '100px'}}>Proxy URL:</span>
                <TextField className="bp3-input bp3-fill"
                           style={{flexGrow: 0.2, marginLeft: '20px'}}
                           value={initialValue}
                           onChange={onChange}
                           placeholder={'http://user:password@host:port'}
                           nullable={true}
                />
            </ControlGroup>
        );
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Components
    // Note (forman): could make this React component later

    private renderDirectoryPath(propertyName, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom: '1em'}}>
                <p>{label}:</p>
                <ControlGroup style={{display: 'flex', alignItems: 'center'}}>
                    <TextField className="bp3-input"
                               style={{flexGrow: 1}}
                               value={initialValue}
                               placeholder="Enter local directory path"
                               onChange={onChange}
                    />
                    <AnchorButton
                        intent={Intent.PRIMARY} style={{flex: 'none'}}
                        onClick={() => PreferencesDialog.showOpenDirectoryDialog(initialValue, onChange)}>
                        ...
                    </AnchorButton>
                </ControlGroup>
            </div>
        );
    }

    private renderStringValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <ControlGroup style={{width: '100%', marginBottom: '1em', display: 'flex', alignItems: 'center'}}>
                <span style={{flexGrow: 0.8}}>{label}:</span>
                <TextField className="bp3-input"
                           style={{flexGrow: 0.2}}
                           value={initialValue}
                           onChange={onChange}
                />
            </ControlGroup>
        );
    }

    private renderBooleanValue(propertyName: string, isBackend: boolean, label: string) {
        const initialValue = this.getStateValue(propertyName, isBackend);
        const onChange = this.getChangeHandler(propertyName, isBackend);
        return (
            <div style={{width: '100%', marginBottom: '1em'}}>
                <Switch checked={initialValue}
                        label={label}
                        onChange={(event: any) => onChange(event.target.checked)}/>
            </div>
        );
    }

    private getChangeHandler(propertyName: string, isBackend: boolean) {
        return (value: any) => {
            const change = {};
            change[propertyName] = isDefined(value) ? (isDefined(value.value) ? value.value : value) : null;
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
            title: 'Select Directory',
            defaultPath: defaultPath,
            buttonLabel: 'Select',
            properties: [
                'openDirectory' as OpenDialogProperty,
                'createDirectory' as OpenDialogProperty,
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



