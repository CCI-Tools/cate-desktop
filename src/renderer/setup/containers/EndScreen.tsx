import * as React from "react";
import {connect} from "react-redux";
import {Checkbox} from "@blueprintjs/core";
import {State} from "../state";
import * as actions from "../actions";

interface IEndScreenProps {
    keepCateUpToDate: boolean;
}

function mapStateToProps(state: State): IEndScreenProps {
    return {
        keepCateUpToDate: state.keepCateUpToDate,
    };
}

class _EndScreen extends React.PureComponent<IEndScreenProps & actions.DispatchProp> {
    render() {
        return (
            <div>
                <p>Cate Desktop is now ready to be used. Thanks for your patience!</p>

                <p style={{marginTop: 32}}>Setup can check and update the <code>cate</code> Python package automatically before every start of
                    Cate Desktop.</p>

                <div style={{marginLeft: 32}}>
                    <Checkbox label="Automatically update Cate Python package"
                              checked={this.props.keepCateUpToDate}
                              onChange={(event: any) => this.props.dispatch(actions.setAutoUpdateCate(event.target.checked))}/>
                </div>

                <p style={{marginTop: 64}}>Click <strong>Done</strong> to end setup and start Cate Desktop.</p>
            </div>
        );
    }
}

export const EndScreen = connect(mapStateToProps)(_EndScreen);
