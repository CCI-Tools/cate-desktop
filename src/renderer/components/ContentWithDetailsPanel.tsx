import * as React from "react";
import {SplitPane} from "./SplitPane";
import {Switch} from "@blueprintjs/core";


export interface IContentWithDetailsPanelProps {
    showDetails: boolean;
    actionComponent?: JSX.Element|null;
    onShowDetailsChange: (value: boolean) => void;
    isSplitPanel?: boolean;
    initialContentHeight?: number;
}


export class ContentWithDetailsPanel extends React.PureComponent<IContentWithDetailsPanelProps, any> {

    constructor(props: IContentWithDetailsPanelProps) {
        super(props);
    }

    private handleSwitchChange(event) {
        this.props.onShowDetailsChange(event.target.checked);
    }

    render(): JSX.Element {
        const contentChild = this.props.children[0];
        const detailsChild = this.props.children[1];

        const detailsSwitch = (<Switch checked={this.props.showDetails}
                                       style={{alignSelf: 'flex-end', marginBottom: 0}}
                                       label="Details"
                                       disabled={!detailsChild}
                                       onChange={this.handleSwitchChange.bind(this)}/>);

        const detailsContentPanel = this.props.showDetails ? detailsChild : null;

        let detailsControlPanel;
        if (this.props.actionComponent) {
            detailsControlPanel = (
                <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    {detailsSwitch}
                    <span style={{flex: 'auto'}}/>
                    {this.props.actionComponent}
                </div>
            );
        } else {
            detailsControlPanel = detailsSwitch;
        }

        const detailsPanel = (
            <div>
                {detailsControlPanel}
                {detailsContentPanel}
            </div>
        );

        let contentWithDetailsPanel;
        if (this.props.isSplitPanel) {
            contentWithDetailsPanel = (
                <SplitPane dir="ver" initialSize={this.props.initialContentHeight || 300}>
                    {contentChild}
                    {detailsPanel}
                </SplitPane>);
        } else {
            contentWithDetailsPanel = (
                <div>
                    {contentChild}
                    {detailsPanel}
                </div>
            );
        }

        return contentWithDetailsPanel;
    }
}

