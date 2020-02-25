import * as React from 'react';
import { AnimationViewDataState, ResourceState, State } from '../state';
import { connect, DispatchProp } from 'react-redux';
import { ViewState } from '../components/ViewState';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { Card } from '../components/Card';
import { isNumber } from '../../common/types';


interface IAnimationViewOwnProps {
    view: ViewState<AnimationViewDataState>;
}

interface IAnimationViewProps extends IAnimationViewOwnProps {
    baseUrl: string;
    baseDir: string | null;
    animationResources: ResourceState[];
    mplWebSocketUrl: string;
}

interface IAnimationViewState {
    loading?: boolean;
}

function mapStateToProps(state: State, ownProps: IAnimationViewOwnProps): IAnimationViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        baseDir: selectors.workspaceBaseDirSelector(state),
        animationResources: selectors.animationResourcesSelector(state),
        mplWebSocketUrl: selectors.mplWebSocketUrlSelector(state),
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class AnimationView extends React.Component<IAnimationViewProps & DispatchProp<State>, IAnimationViewState> {
    static readonly DIV_STYLE: React.CSSProperties = {
        width: '100%',
        height: '100%',
        //height: 400,
        overflowX: 'hidden',
        overflowY: 'auto'
    };

    constructor(props: IAnimationViewProps & DispatchProp<State>) {
        super(props);
        this.state = {};
        this.divElement = null;
        this.onRef = this.onRef.bind(this)
    }

    private divElement;

    componentWillMount(): void {
        if (!this.props.view.data.innerHTML && !this.state.loading) {
            this.setState({loading: true}, () => {
                this.props.dispatch(actions.loadAnimationViewData(this.props.view.id, this.props.view.data.resourceId) as any);
            });
        }
    }

    private onRef(divElement: HTMLDivElement) {
        this.divElement = divElement;

        if (divElement && this.props.view.data.innerHTML) {
            const elements = divElement.getElementsByTagName('script');
            for (let element of elements) {
                let script = element.innerHTML;
                try {
                    // indirect eval call evaluates in global scope
                    // eslint-disable-next-line
                    eval('eval')(script);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    render() {
        const animationResource = this.getAnimationResource();
        if (!animationResource) {
            return (<Card>Animation not found.</Card>);
        }

        const animationViewData = this.props.view.data;
        let innerHTML = animationViewData.innerHTML;
        let status = animationViewData.status;
        if (innerHTML) {
            //console.log("AnimationView: ", innerHTML);
            return (
                <div style={AnimationView.DIV_STYLE}
                     dangerouslySetInnerHTML={{__html: innerHTML}}
                     ref={this.onRef}
                />
            );
        } else if (isNumber(status) && (status < 200 || status >= 300)) {
            return (<Card>`Error loading animation (status ${animationViewData.status}`)</Card>);
        } else if (this.state.loading) {
            return (<Card>Loading animation...</Card>);
        } else {
            return (<Card>???</Card>);
        }
    }

    getAnimationResource(): ResourceState | null {
        const animationViewData = this.props.view.data;
        return this.props.animationResources.find(r => r.id === animationViewData.resourceId);
    }
}

export default connect(mapStateToProps)(AnimationView);


