import * as React from "react";
import {SplitPane} from "./SplitPane";
import {Switch} from "@blueprintjs/core";


export interface IContentWithDetailsPanelProps {
    showDetails: boolean;
    onShowDetailsChange: (value: boolean) => void;
    contentHeight?: number;
    onContentHeightChange?: (value: number) => void;
    actionComponent?: JSX.Element|null;
    isSplitPanel?: boolean;
}


export class ContentWithDetailsPanel extends React.PureComponent<IContentWithDetailsPanelProps, any> {

    constructor(props: IContentWithDetailsPanelProps) {
        super(props);
        this.handleSwitchChange = this.handleSwitchChange.bind(this);
        this.handleContentHeightChange = this.handleContentHeightChange.bind(this);
    }

    private handleSwitchChange(event) {
        this.props.onShowDetailsChange(event.target.checked);
    }

    private handleContentHeightChange(newSize: number, oldSize: number) {
        if (this.props.onContentHeightChange) {
            this.props.onContentHeightChange(newSize);
        }
    }

    render(): JSX.Element {
        const contentChild = this.props.children[0];
        const detailsChild = this.props.children[1];

        const detailsSwitch = (<Switch checked={this.props.showDetails}
                                       style={{alignSelf: 'flex-end', marginBottom: 0}}
                                       label="Details"
                                       disabled={!detailsChild}
                                       onChange={this.handleSwitchChange}/>);

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
                <SplitPane dir="ver"
                           initialSize={this.props.contentHeight || 300}
                           onChange={this.handleContentHeightChange}>
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

