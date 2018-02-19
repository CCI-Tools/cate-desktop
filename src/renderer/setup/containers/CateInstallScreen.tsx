import * as React from "react";
import * as actions from "../actions";
import {connect} from "react-redux";
import {
    CateMode,
    CATE_MODE_CONDA_DIR, CATE_MODE_OLD_CATE_DIR, CATE_MODE_NEW_CATE_DIR
} from "../../../common/setup";
import {State} from "../state";
import {Radio, RadioGroup} from "@blueprintjs/core";
import {PathField} from "../components/PathField";

interface ICateInstallScreenProps {
    cateMode: CateMode;
    newCateDir: string;
    oldCateDir: string;
    condaDir: string;
    validation?: string;
}

function mapStateToProps(state: State): ICateInstallScreenProps {
    return {
        cateMode: state.cateMode,
        newCateDir: state.newCateDir,
        oldCateDir: state.oldCateDir,
        condaDir: state.condaDir,
        validation: state.validations[state.screenId],
    };
}

class _CateInstallScreen extends React.PureComponent<ICateInstallScreenProps & actions.DispatchProp> {

    render() {

        let pathField;
        if (this.props.cateMode === CATE_MODE_NEW_CATE_DIR) {
            pathField = <PathField label="Select a new Cate installation directory:"
                                   placeholder="Directory path"
                                   value={this.props.newCateDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setNewCateDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseNewCateDir())}/>;
        } else if (this.props.cateMode === CATE_MODE_OLD_CATE_DIR) {
            pathField = <PathField label="Select an existing Cate installation directory:"
                                   placeholder="Directory path"
                                   value={this.props.oldCateDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setOldCateDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseOldCateDir())}/>;
        } else if (this.props.cateMode === CATE_MODE_CONDA_DIR) {
            pathField = <PathField label="Select an Anaconda/Miniconda installation directory:"
                                   placeholder="Directory path"
                                   value={this.props.condaDir}
                                   validation={this.props.validation}
                                   onChange={(event) => this.props.dispatch(actions.setCondaDir(event.target.value))}
                                   onBrowse={() => this.props.dispatch(actions.browseCondaDir())}/>;
        }

        return (
            <div>

                <p>Cate Desktop setup requires the Python package <code>cate</code> and various other packages
                    for the data processing.
                </p>

                <p className="pt-text-muted">The Python package <code>cate</code> offers
                    additional functionality such as a Python API to extend Cate's functionality,
                    and a command-line interface <code>cate-cli</code> to access and process data in batch mode.
                    For more information, please refer to the <a href="http://cate.readthedocs.io/en/latest/"
                                                                 target="_blank">documentation</a>.
                    Cate runs with
                        the <a href="https://www.anaconda.com/download/" target="_blank">Anaconda</a> or <a
                            href="https://conda.io/miniconda.html" target="_blank">Miniconda</a> distributions
                        of Python.
                </p>

                <p>Please select an option:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setCateMode(event.target.value))}
                        selectedValue={this.props.cateMode}>
                        <Radio label="Install a new Cate (appropriate for most users)"
                               value={CATE_MODE_NEW_CATE_DIR}/>
                        <Radio label="Use an existing Cate installation or environment"
                               value={CATE_MODE_OLD_CATE_DIR}/>
                        <Radio label={'Install a dedicated Python environment "cate-env"'}
                               value={CATE_MODE_CONDA_DIR}/>
                    </RadioGroup>
                </div>

                <div style={{marginLeft: 32, marginTop: 16}}>
                    {pathField}
                </div>

            </div>
        );
    }
}

export const CateInstallScreen = connect(mapStateToProps)(_CateInstallScreen);
