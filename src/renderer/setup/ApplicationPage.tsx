import * as React from 'react';
import {connect, DispatchProp} from "react-redux";
import {MAX_PANELS, State} from "./state";
import {Button, Intent, Radio, RadioGroup} from "@blueprintjs/core";
import * as actions from "./actions";
import {Panel1} from "./Panel1";
import {Panel2} from "./Panel2";
import {Panel3} from "./Panel3";

interface IApplicationPageProps {
    panelIndex: number;
}

function mapStateToProps(state: State): IApplicationPageProps {
    return {
        panelIndex: state.panelIndex,
    };
}

const PANELS = [
    <Panel1/>,
    <Panel2/>,
    <Panel3/>,
];

class _ApplicationPage extends React.PureComponent<IApplicationPageProps & DispatchProp<IApplicationPageProps>, null> {

    constructor(props: IApplicationPageProps & DispatchProp<IApplicationPageProps>) {
        super(props);
    }

    public render(): React.ReactNode {
        const panel = PANELS[this.props.panelIndex];

        return (
            <div style={{width: "100%", height: "100%", padding: 10}}>
                <div style={{width: "100%", height: "calc(100% - 3em)"}}>
                    {panel}
                </div>
                <div style={{width: "100%", height: "3em"}}>
                    <span style={{padding: 6}}>
                        <Button style={{margin: 2, marginRight: 16}}
                                text="Cancel"
                                onClick={() => this.props.dispatch(actions.cancel())}/>
                        <Button style={{margin: 2}}
                                text="Back"
                                disabled={this.props.panelIndex === 0}
                                iconName="arrow-left"
                                intent={Intent.PRIMARY}
                                onClick={() => this.props.dispatch(actions.back())}/>
                        <Button style={{margin: 2}}
                                text="Next"
                                disabled={this.props.panelIndex === MAX_PANELS - 1}
                                iconName="arrow-right"
                                intent={Intent.PRIMARY}
                                onClick={() => this.props.dispatch(actions.next())}/>
                    </span>
                </div>
            </div>
        );
    }
}

export const ApplicationPage = connect(mapStateToProps)(_ApplicationPage);

