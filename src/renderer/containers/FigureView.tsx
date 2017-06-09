import * as React from 'react';
import {State, ResourceState, FigureViewDataState, MplModuleState} from "../state";
import {connect, Dispatch} from "react-redux";
import {ViewState} from "../components/ViewState";
import * as selectors from "../selectors";
import {MplFigure} from "../components/matplotlib/MplFigure";
import {MplFigurePanel} from "../components/matplotlib/MplFigurePanel";
import {getMPLDownloadUrl, getMPLWebSocketUrl} from "../state-util";
import * as actions from "../actions";


interface IFigureViewOwnProps {
    view: ViewState<FigureViewDataState>;
}

interface IFigureViewProps extends IFigureViewOwnProps {
    dispatch?: Dispatch<State>;
    baseUrl: string;
    baseDir: string | null;
    figureResources: ResourceState[];
    mplWebSocketUrl: string;
    mplModule: MplModuleState;
}

function mapStateToProps(state: State, ownProps: IFigureViewOwnProps): IFigureViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        baseDir: selectors.workspaceBaseDirSelector(state),
        figureResources: selectors.figureResourcesSelector(state),
        mplWebSocketUrl: selectors.mplWebSocketUrlSelector(state),
        mplModule: selectors.mplModuleSelector(state),
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class FigureView extends React.Component<IFigureViewProps, null> {
    static readonly DIV_STYLE = {width: '100%', minWidth: '100%', maxWidth: '100%', height: '100%', overflowY: 'auto'};

    constructor(props: IFigureViewProps) {
        super(props);
        this.onDownload = this.onDownload.bind(this);
    }

    private onDownload(figureId: number) {
        console.log("FigureView: onDownload:", figureId);
        const downloadUrl = getMPLDownloadUrl(this.props.baseUrl, this.props.baseDir, figureId, 'png');
        console.log("FigureView: downloadUrl:", downloadUrl);
        // TODO: download
    }

    componentWillMount(): void {
        if (!this.props.mplModule.status) {
            this.props.dispatch(actions.loadMplModule());
        }
    }

    render() {
        let mplModule = this.props.mplModule;
        if (mplModule.status === 'done') {
            const plots = [];
            const view = this.props.view;
            const figureResources = this.getFigureResources();
            for (let figureResource of figureResources) {
                let id = `MplFigurePanel-${figureResource.name}-${view.id}`;
                plots.push(
                    <MplFigurePanel
                        key={id}
                        id={id}
                        figureId={figureResource.figureId}
                        figureName={figureResource.name}
                        webSocketUrl={getMPLWebSocketUrl(this.props.mplWebSocketUrl, this.props.baseDir, figureResource.figureId)}
                        onDownload={this.onDownload}
                    />
                );
            }
            return (<div style={FigureView.DIV_STYLE}>{plots}</div>);
        } else if (mplModule.status === 'loading') {
            return (<p>{"Loading matplotlib module..."}</p>);
        } else if (mplModule.status === 'error') {
            return (<p>{`Matplotlib module load error: ${mplModule.message}`}</p>);
        } else {
            return (<p>{`Matplotlib module status=${mplModule.status}, message=${mplModule.message}`}</p>);
        }
    }

    getFigureResources(): ResourceState[] {
        const view = this.props.view;
        if (view.data.figureResourceIds) {
            const figureResourceMap = {};
            for (let figureResource of this.props.figureResources) {
                figureResourceMap[figureResource.name] = figureResource;
            }
            return view.data.figureResourceIds.map(name => figureResourceMap[name]);
        } else {
            return this.props.figureResources;
        }
    }
}

export default connect(mapStateToProps)(FigureView);


