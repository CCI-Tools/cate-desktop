import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, Activity, WorkspaceState} from "../state";
import {DatasetAPI} from '../webapi';
import {SplitPane} from "./SplitPane";
import {ProgressBar, TabList, Tab, TabPanel, Button} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "./ListBox";
import {Card} from "./Card";
import {OpenDatasetDialog, IOpenDatasetDialogState} from "./OpenDatasetDialog";
import {OperationAPI} from "../webapi/apis/OperationAPI";
import {JobProgress} from "../webapi/Job";
import * as actions from '../actions';
import {WorkspaceAPI} from "../webapi/apis/WorkspaceAPI";

interface IActivityPanelProps {
    dispatch?: any;
    activities : Array<Activity>;
}

function mapStateToProps(state: State): IActivityPanelProps {
    return {
        activities: state.control.activities
    };
}

/**
 * The ActivityPanelPanel is used display all activities originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class ActivityPanel extends React.Component<IActivityPanelProps, null> {
    private activities;
    constructor(props: IActivityPanelProps) {
        super(props);
    }

    render() {
        const renderItem = (itemIndex: number) => {
            let pm = null;
            let item = this.props.activities[itemIndex];
            if (item.progress) {
                pm = <ProgressBar value={item.progress} />;
            }
            let msg = null;
            if (item.messages) {
                const listItems = item.messages.map((text, msgIndex) =>
                    <li key={msgIndex}>{text}</li>
                );
                msg = <ul>{listItems}</ul>;
            }
            return (<span>{item.title}{pm}{msg}</span>);
        };
        const allActivities = this.props.activities || []
        return (
            <ExpansionPanel icon="pt-icon-database" text="Activities" isExpanded={true} defaultHeight={400}>
                <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                    <ListBox numItems={allActivities.length}
                             getItemKey={index => allActivities[index].jobId}
                             renderItem={renderItem}
                             selectionMode={ListBoxSelectionMode.SINGLE}/>
                </div>
            </ExpansionPanel>
        );

    }
}
export default connect(mapStateToProps)(ActivityPanel);
