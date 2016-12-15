import * as React from "react";
import {SplitPane} from "./SplitPane";
import {Switch} from "@blueprintjs/core";


export interface IContentWithDetailsPanelProps {
    showDetails: boolean;
    actions?: JSX.Element|null;
    onShowDetailsChange: () => void;
    isSplitPanel?: boolean;
    initialContentHeight?: number;
}


export class ContentWithDetailsPanel extends React.PureComponent<IContentWithDetailsPanelProps, any> {

    constructor(props: IContentWithDetailsPanelProps) {
        super(props);
    }

    render(): JSX.Element {
        const contentChild = this.props.children[0];
        const detailsChild = this.props.children[1];

        const detailsSwitch = (<Switch checked={this.props.showDetails}
                                       label="Details"
                                       disabled={detailsChild ? true : false}
                                       onChange={this.props.onShowDetailsChange}/>);

        const detailsContentPanel = this.props.showDetails ? detailsChild : null;

        let detailsControlPanel;
        if (this.props.actions) {
            detailsControlPanel = (
                <div style={{display: 'flex', marginBottom: 4, alignItems: 'center'}}>
                    {detailsSwitch}
                    <span style={{flex: 'auto'}}/>
                    { this.props.actions}
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
                <SplitPane direction="ver" initialSize={this.props.initialContentHeight || 300}>
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

