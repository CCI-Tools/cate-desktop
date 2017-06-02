import * as React from "react";
import {connect} from "react-redux";
import {ResourceState, State} from "../state";
import {NO_CHARTS} from "../messages";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import * as selectors from "../selectors";

interface IDispatch {
    dispatch: (action: any) => void;
}

interface IChartSettingsPanelProps {
    figureResources: ResourceState[];
}


function mapStateToProps(state: State): IChartSettingsPanelProps {
    return {
        figureResources: selectors.figureResourcesSelector(state),
    };
}

/**
 * The ChartSettingsPanel is used to select individual plots/charts
 * and lets users change its data source settings (e.g. variable index)
 * and style.
 *
 * @author Norman Fomferra
 */
class ChartSettingsPanel extends React.Component<IChartSettingsPanelProps & IDispatch, null> {
    constructor(props: IChartSettingsPanelProps) {
        super(props);
    }

    render() {
        let figureResources = this.props.figureResources;
        if (figureResources&& figureResources.length) {
            return this.renderChartList();
        }
        return NO_CHARTS;
    }

    private static getItemKey(figureResource: ResourceState) {
        return figureResource.name;
    }

    private static renderItem(figureResource: ResourceState) {
        return (<span>{`${figureResource.name} (${figureResource.figureId})`}</span>);
    }

    private renderChartList() {
        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.figureResources}
                         getItemKey={ChartSettingsPanel.getItemKey}
                         renderItem={ChartSettingsPanel.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={null}
                         onSelection={null}/>
            </ScrollablePanelContent>
        );
    }
}
export default connect(mapStateToProps)(ChartSettingsPanel);
