import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {State} from "../state";

interface IEndScreenProps {
}

function mapStateToProps(state: State): IEndScreenProps {
    return {};
}

class _EndScreen extends React.PureComponent<IEndScreenProps & DispatchProp<IEndScreenProps>> {
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
