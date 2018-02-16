import * as React from "react";
import * as actions from "./actions";
import {connect, DispatchProp} from "react-redux";
import {State} from "./state";
import {Radio, RadioGroup} from "@blueprintjs/core";

interface IPanel3Props {
}

function mapStateToProps(state: State): IPanel3Props {
    return {};
}

class _Panel3 extends React.PureComponent<IPanel3Props & DispatchProp<IPanel3Props>> {
    render() {
        return (
            <p>Gefällt mir nicht ganz so gut</p>
        );
    }
}

export const Panel3 = connect(mapStateToProps)(_Panel3);
