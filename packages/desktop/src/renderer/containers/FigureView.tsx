import * as React from 'react';
import { FigureViewDataState, ResourceState, State } from '../state';
import { connect, DispatchProp } from 'react-redux';
import { ViewState } from '../components/ViewState';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { MplFigurePanel } from '../components/matplotlib/MplFigurePanel';
import { getMPLDownloadUrl, getMPLWebSocketUrl } from '../state-util';
import { Card } from '../components/Card';


interface IFigureViewOwnProps {
    view: ViewState<FigureViewDataState>;
}

interface IFigureViewProps extends IFigureViewOwnProps {
    baseUrl: string;
    baseDir: string | null;
    figureResources: ResourceState[];
    mplWebSocketUrl: string;
}

function mapStateToProps(state: State, ownProps: IFigureViewOwnProps): IFigureViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        baseDir: selectors.workspaceBaseDirSelector(state),
        figureResources: selectors.figureResourcesSelector(state),
        mplWebSocketUrl: selectors.mplWebSocketUrlSelector(state),
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class FigureView extends React.Component<IFigureViewProps & DispatchProp<State>, null> {
    static readonly DIV_STYLE = {width: '100%', height: '100%', overflowX: 'hidden', overflowY: 'auto'};

    constructor(props: IFigureViewProps & DispatchProp<State>) {
        super(props);
        this.onDownload = this.onDownload.bind(this);
    }

    onDownload(figureId: number) {
        const imageBaseUrl = getMPLDownloadUrl(this.props.baseUrl, this.props.baseDir, figureId);
        this.props.dispatch(actions.saveFigureImageAs(imageBaseUrl, figureId) as any);
    }

    render() {
        const view = this.props.view;
        const figureResource = this.getFigureResource();
        if (!figureResource) {
            return (<Card>Figure not found.</Card>);
        }
        const compId = `MplFigurePanel-${figureResource.id}-${view.id}`;
        return (
            <MplFigurePanel
                key={compId}
                id={compId}
                figureId={figureResource.id}
                figureUpdateCount={figureResource.updateCount}
                figureName={figureResource.name}
                webSocketUrl={getMPLWebSocketUrl(this.props.mplWebSocketUrl, this.props.baseDir, figureResource.id)}
                onDownload={this.onDownload}
            />
        );
    }

    getFigureResource(): ResourceState | null {
        const figureViewData = this.props.view.data;
        return this.props.figureResources.find(r => r.id === figureViewData.resourceId);
    }
}

export default connect(mapStateToProps)(FigureView);


