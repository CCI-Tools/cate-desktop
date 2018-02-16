import * as React from "react";
import * as actions from "../actions";
import {connect, DispatchProp} from "react-redux";
import {
    CATE_MODE_NEW_ENV, CATE_MODE_TOP_LEVEL, CateMode, CONDA_MODE_EXISTING, CONDA_MODE_NEW, CondaMode,
    State
} from "../state";
import {Radio, RadioGroup} from "@blueprintjs/core";

interface ICateInstallScreenProps {
    condaMode: CondaMode;
    cateMode: CateMode;
}

function mapStateToProps(state: State): ICateInstallScreenProps {
    return {
        condaMode: state.condaMode,
        cateMode: state.cateMode,
    };
}

class _CateInstallScreen extends React.PureComponent<ICateInstallScreenProps & DispatchProp<ICateInstallScreenProps>> {

    render() {

        const recommendationTopLevel = this.props.condaMode === CONDA_MODE_NEW ? "(recommended)" : "";
        const recommendationNewEnv = this.props.condaMode === CONDA_MODE_EXISTING ? "(recommended)" : "";

        return (
            <div>

                <p>Cate Desktop setup requires the Python package <code>cate</code> and various other packages
                    for the data processing. The Python packages can either be installed into a newly created,
                    dedicated environment (named <code>cate-env</code>) or be installed into the top-level
                    Anaconda/Miniconda installation.
                </p>

                <p>Please select where to install the Python packages:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setCateMode(event.target.value))}
                        selectedValue={this.props.cateMode}>
                        <Radio label={`Into the top-level Anaconda/Miniconda ${recommendationTopLevel}`}
                               value={CATE_MODE_TOP_LEVEL}/>
                        <Radio label={`Into a newly created environment in Anaconda/Miniconda ${recommendationNewEnv}`}
                               value={CATE_MODE_NEW_ENV}/>
                    </RadioGroup>
                </div>

                <p className="pt-text-muted" style={{marginTop: 32}}>Note that the Python package <code>cate</code>
                    offers additional functionality such as a Python API to extend Cate's functionality,
                    and a command-line interface <code>cate-cli</code> to access and process data in batch mode.
                    For more information, please refer to the <a href="" target="_blank">documentation</a>.
                </p>

            </div>
        );
    }
}

export const CateInstallScreen = connect(mapStateToProps)(_CateInstallScreen);
