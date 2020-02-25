import * as React from 'react';
import { connect } from 'react-redux';
import { Icon, Intent, Radio, RadioGroup } from '@blueprintjs/core';
import {
    SETUP_MODE_AUTO,
    SETUP_MODE_USER,
    SETUP_REASON_INSTALL_CATE,
    SetupMode,
    SetupReason,
} from '../../../common/setup';
import * as actions from '../actions';
import { State } from '../state';
import { SetupScreen } from '../components/SetupScreen';

interface IStartScreenProps {
    setupReason: SetupReason;
    oldCateVersion: string;
    newCateVersion: string;
    setupMode: SetupMode;
    validation?: string;
}

function mapStateToProps(state: State): IStartScreenProps {
    return {
        setupReason: state.setupInfo.setupReason,
        oldCateVersion: state.setupInfo.oldCateVersion,
        newCateVersion: state.setupInfo.newCateVersion,
        setupMode: state.setupMode,
        validation: state.validations[state.screenId],
    };
}

class _StartScreen extends React.PureComponent<IStartScreenProps & actions.DispatchProp> {

    render() {

        let reasonText;
        if (this.props.setupReason === SETUP_REASON_INSTALL_CATE) {
            reasonText = <p>Cate Desktop requires installing the Python
                package <code>{`cate-${this.props.newCateVersion}`}</code>.</p>;
        } else {
            reasonText = <p>Cate Desktop requires an update of the Python
                package <code>{`cate-${this.props.oldCateVersion}`}</code> to <code>{`cate-${this.props.newCateVersion}`}</code>.
            </p>;
        }

        let validationErrorDiv;
        if (this.props.validation && this.props.setupMode === SETUP_MODE_AUTO) {
            validationErrorDiv = (
                <div style={{marginTop: 32}}>
                    <Icon icon="warning-sign" intent={Intent.WARNING}/>
                    <span style={{marginLeft: 8}}>A problem prevents automatic setup: {this.props.validation}</span>
                </div>
            );
        }

        const panel = (
            <div>
                {reasonText}

                <p>Please select an option:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setSetupMode(event.target.value))}
                        selectedValue={this.props.setupMode}>
                        <Radio label="Automatic setup (appropriate for most users)" value={SETUP_MODE_AUTO}/>
                        <Radio label="User-defined setup" value={SETUP_MODE_USER}/>
                    </RadioGroup>
                </div>

                <p className="bp3-text-muted" style={{marginTop: 32}}>Background: The Python package <code><a
                    href="https://github.com/CCI-Tools/cate" target="_blank">cate</a></code> provides
                    the data processing and visualisation service to Cate Desktop.
                    In addition, it offers a command-line interface <code>cate-cli</code> to
                    access and process data in batch mode. It also has an API to add new functions to Cate easily.
                    For more information, please refer to
                    the <a href="http://cate.readthedocs.io/en/latest/" target="_blank">documentation</a>.
                </p>

                {validationErrorDiv}

            </div>
        );

        return (
            <SetupScreen title="Cate Desktop Setup"
                         panel={panel}
                         noBackButton={true}
                         nextButtonDisabled={!!validationErrorDiv}
                         onNextButtonClick={() => this.props.dispatch(actions.moveForward())}
                         onCancelClick={() => this.props.dispatch(actions.cancelSetup())}
            />
        );
    }
}

export const StartScreen = connect(mapStateToProps)(_StartScreen);
