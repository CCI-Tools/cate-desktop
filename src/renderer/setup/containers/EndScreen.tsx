import * as React from "react";
import {connect} from "react-redux";
import {State} from "../state";
import * as actions from "../actions";

interface IEndScreenProps {
}

function mapStateToProps(state: State): IEndScreenProps {
    return {};
}

class _EndScreen extends React.PureComponent<IEndScreenProps & actions.DispatchProp> {
    render() {
        return (
            <div>
                <p>Cate is now ready. Thanks for your patience.</p>

                <p>Click <strong>Done</strong> to end setup and start Cate Desktop.</p>
            </div>
        );
    }
}

export const EndScreen = connect(mapStateToProps)(_EndScreen);
