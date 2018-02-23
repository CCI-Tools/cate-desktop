import * as React from 'react';
import {connect} from "react-redux";
import {
    SCREEN_ID_CONFIG, SCREEN_ID_DONE, SCREEN_ID_START, SCREEN_ID_RUN, ScreenId,
    State
} from "../state";
import * as actions from "../actions";
import {StartScreen} from "./StartScreen";
import {ConfigScreen} from "./ConfigScreen";
import {RunScreen} from "./RunScreen";
import {DoneScreen} from "./DoneScreen";


interface ISetupContainerProps {
    screenId: ScreenId;
}

function mapStateToProps(state: State): ISetupContainerProps {
    return {
        screenId: state.screenId,
    };
}

class _SetupContainer extends React.PureComponent<ISetupContainerProps & actions.DispatchProp> {

    public render(): React.ReactNode {
        switch (this.props.screenId) {
            case SCREEN_ID_START:
                return <StartScreen/>;
            case SCREEN_ID_CONFIG:
                return <ConfigScreen/>;
            case SCREEN_ID_RUN:
                return <RunScreen/>;
            case SCREEN_ID_DONE:
                return <DoneScreen/>;
        }
    }
}

export const SetupContainer = connect(mapStateToProps)(_SetupContainer);
