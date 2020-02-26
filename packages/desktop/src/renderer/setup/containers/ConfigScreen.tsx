import * as React from 'react';
import * as actions from '../actions';
import { connect } from 'react-redux';
import {
    CATE_MODE_CONDA_DIR,
    CATE_MODE_NEW_CATE_DIR,
    CATE_MODE_OLD_CATE_DIR,
    CateMode,
    SETUP_REASON_INSTALL_CATE,
    SETUP_REASON_UPDATE_CATE,
    SetupReason
} from '../../../common/setup';
import { State } from '../state';
import { Radio, RadioGroup } from '@blueprintjs/core';
import { PathField } from '../components/PathField';
import { SetupScreen } from '../components/SetupScreen';

interface IConfigScreenProps {
    setupReason: SetupReason;
    cateMode: CateMode;
    newCateDir: string;
    oldCateDir: string;
    condaDir: string;
    validation?: string;
}

function mapStateToProps(state: State): IConfigScreenProps {
    return {
        setupReason: state.setupInfo.setupReason,
        cateMode: state.cateMode,
        newCateDir: state.newCateDir,
        oldCateDir: state.oldCateDir,
        condaDir: state.condaDir,
        validation: state.validations[state.screenId],
    };
}

class _ConfigScreen extends React.PureComponent<IConfigScreenProps & actions.DispatchProp> {

    render() {

        let newRecommended = this.props.setupReason === SETUP_REASON_INSTALL_CATE ? ' (recommended)' : '';
        let oldRecommended = this.props.setupReason === SETUP_REASON_UPDATE_CATE ? ' (recommended)' : '';

        let pathField;
        if (this.props.cateMode === CATE_MODE_NEW_CATE_DIR) {
            pathField = <PathField label="Cate installation directory (must be empty):"
                                   placeholder="Directory path"
                                   value={this.props.newCateDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setNewCateDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseNewCateDir())}/>;
        } else if (this.props.cateMode === CATE_MODE_OLD_CATE_DIR) {
            pathField = <PathField label="Existing Cate installation or Python environment directory:"
                                   placeholder="Directory path"
                                   value={this.props.oldCateDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setOldCateDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseOldCateDir())}/>;
        } else if (this.props.cateMode === CATE_MODE_CONDA_DIR) {
            pathField = <PathField label="Existing Anaconda/Miniconda installation directory:"
                                   placeholder="Directory path"
                                   value={this.props.condaDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setCondaDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseCondaDir())}/>;
        }

        const panel = (
            <div>

                <p>Here you can customize how you want the Python package <code>cate</code> to be installed or updated.
                </p>

                <p className="bp3-text-muted">Please note, the latter option requires you to select an
                    existing <a href="https://www.anaconda.com/download/" target="_blank">Anaconda</a> or <a
                        href="https://conda.io/miniconda.html" target="_blank">Miniconda</a> Python
                    distribution.
                </p>

                <p>Please select an option:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setCateMode(event.target.value))}
                        selectedValue={this.props.cateMode}>
                        <Radio label={`Install a new Cate ${newRecommended}`}
                               value={CATE_MODE_NEW_CATE_DIR}/>
                        <Radio label={`Use and optionally update an existing Cate ${oldRecommended}`}
                               value={CATE_MODE_OLD_CATE_DIR}/>
                        <Radio label={'Install Cate in new environment "cate-env" of an existing Anaconda/Miniconda'}
                               value={CATE_MODE_CONDA_DIR}/>
                    </RadioGroup>
                </div>

                <div style={{marginLeft: 32, marginTop: 16}}>
                    {pathField}
                </div>

            </div>
        );

        return <SetupScreen
            title="Configure Setup"
            panel={panel}
            nextButtonDisabled={!!this.props.validation}
            onBackButtonClick={() => this.props.dispatch(actions.moveBack())}
            onNextButtonClick={() => this.props.dispatch(actions.moveForward())}
            onCancelClick={() => this.props.dispatch(actions.cancelSetup())}
        />;
    }
}

export const ConfigScreen = connect(mapStateToProps)(_ConfigScreen);
