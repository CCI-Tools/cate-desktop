import * as React from 'react';
import {connect, DispatchProp} from "react-redux";
import {
    SCREEN_ID_CATE_INSTALL, SCREEN_ID_CONDA_INSTALL, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_TASK_MONITOR, ScreenId,
    State
} from "../state";
import {Button, Intent} from "@blueprintjs/core";
import * as actions from "../actions";
import {StartScreen} from "./StartScreen";
import {CondaInstallScreen} from "./CondaInstallScreen";
import {CateInstallScreen} from "./CateInstallScreen";
import {TaskMonitorScreen} from "./TaskMonitorScreen";
import {EndScreen} from "./EndScreen";

interface ISetupContainerProps {
    screenId: ScreenId;
    progress: number | null;
}

function mapStateToProps(state: State): ISetupContainerProps {
    return {
        screenId: state.screenId,
        progress: state.progress,
    };
}

interface Screen {
    panel: React.ReactElement<any>;
    validate?: (props: any) => boolean;
}

type Screens = { [screenId: string]: Screen };

const SCREENS: Screens = {
    [SCREEN_ID_START]: {panel: <StartScreen/>,},
    [SCREEN_ID_CONDA_INSTALL]: {panel: <CondaInstallScreen/>,},
    [SCREEN_ID_CATE_INSTALL]: {panel: <CateInstallScreen/>,},
    [SCREEN_ID_TASK_MONITOR]: {panel: <TaskMonitorScreen/>,},
    [SCREEN_ID_END]: {panel: <EndScreen/>,},
};

class _SetupContainer extends React.PureComponent<ISetupContainerProps & DispatchProp<ISetupContainerProps>, null> {

    constructor(props: ISetupContainerProps & DispatchProp<ISetupContainerProps>) {
        super(props);
    }

    public render(): React.ReactNode {
        const screen = SCREENS[this.props.screenId];

        let canMoveBack = this.props.progress === null;
        let canMoveForward = this.props.progress === null || this.props.progress === 1;
        const validate = screen.validate;
        if (validate) {
            canMoveForward = canMoveForward && validate(this.props);
        }

        let backButton;
        let nextButton;
        let endButton;

        if (this.props.screenId !== SCREEN_ID_START) {
            backButton = <Button style={{margin: 2}}
                                 text="Back"
                                 disabled={!canMoveForward}
                                 iconName="arrow-left"
                                 intent={Intent.PRIMARY}
                                 onClick={() => this.props.dispatch(actions.moveBack())}/>;
        }

        if (this.props.screenId === SCREEN_ID_END) {
            endButton = <Button style={{margin: 2}}
                                 text="Done"
                                 disabled={!canMoveForward}
                                 iconName="tick-circle"
                                 intent={Intent.PRIMARY}
                                 onClick={() => this.props.dispatch(actions.endSetup())}/>;
        } else {
            nextButton = <Button style={{margin: 2}}
                                 text="Next"
                                 disabled={!canMoveForward}
                                 iconName="arrow-right"
                                 intent={Intent.PRIMARY}
                                 onClick={() => this.props.dispatch(actions.moveForward())}/>;
        }

        return (
            <div style={{width: "100%", height: "100%", padding: 10}}>
                <div style={{width: "100%", height: "calc(100% - 3em)"}}>
                    {screen.panel}
                </div>
                <div style={{width: "100%", height: "3em"}}>
                    <span style={{padding: 6}}>
                        <Button style={{margin: 2, marginRight: 16}}
                                text="Cancel"
                                onClick={() => this.props.dispatch(actions.cancelSetup())}/>
                        {backButton}
                        {nextButton}
                        {endButton}
                    </span>
                </div>
            </div>
        );
    }
}

export const SetupContainer = connect(mapStateToProps)(_SetupContainer);

