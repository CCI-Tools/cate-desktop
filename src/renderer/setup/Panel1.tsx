import * as React from "react";
import * as actions from "./actions";
import {connect, DispatchProp} from "react-redux";
import {State} from "./state";
import {Button, Label, Radio, RadioGroup} from "@blueprintjs/core";

interface IPanel1Props {
    mode: "new" | "existing";
}

function mapStateToProps(state: State): IPanel1Props {
    return {
        mode: state.mode,
    };
}

class _Panel1 extends React.PureComponent<IPanel1Props & DispatchProp<IPanel1Props>> {

    render() {
        const modeExisting = this.props.mode === "existing";
        return (
            <div>

                <p>Cate Desktop requires a Python 3.6 Anaconda or Miniconda distribution in which it will create
                    a dedicated Python environment and install the Python package <code>cate</code>.
                </p>

                <p>The <code>cate</code> package can be used independently of Cate Desktop, for example it comprises
                    a programming API that you can use to extend Cate and command-line interface (CLI) for running
                    Cate in batch mode. For more information please refer to the <a
                        href="http://cate.readthedocs.io/en/latest/" target="_blank">documentation</a>.
                </p>

                <div style={{marginLeft: 32}}>

                    <RadioGroup
                        label="Please select an option to proceed"
                        onChange={(event: any) => this.props.dispatch(actions.mode(event.target.value))}
                        selectedValue={this.props.mode}>
                        <Radio label="Let Cate install a new Miniconda" value="new"/>
                        <Radio label="Use an existing Anaconda or Miniconda installation" value="existing"/>
                    </RadioGroup>

                </div>

                <p/>

                <p>After the successful setup of the Python environment <strong>this screen will not be shown
                    again</strong>.</p>
            </div>
        );
    }
}

export const Panel1 = connect(mapStateToProps)(_Panel1);
