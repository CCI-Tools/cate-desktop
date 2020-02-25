import * as React from 'react';
import { connect } from 'react-redux';
import { SETUP_STATUS_SUCCEEDED, SetupStatus, State } from '../state';
import * as actions from '../actions';
import { SetupScreen } from '../components/SetupScreen';
import { Intent } from '@blueprintjs/core';

interface IEndScreenProps {
    setupStatus: SetupStatus;
    autoUpdateCate: boolean;
}

function mapStateToProps(state: State): IEndScreenProps {
    return {
        setupStatus: state.setupStatus,
        autoUpdateCate: state.autoUpdateCate,
    };
}

class _EndScreen extends React.PureComponent<IEndScreenProps & actions.DispatchProp> {

    constructor(props) {
        super(props);
        this.handleBackClicked = this.handleBackClicked.bind(this);
        this.handleEndClicked = this.handleEndClicked.bind(this);
        this.handleCancelClicked = this.handleCancelClicked.bind(this);
    }

    handleBackClicked() {
        this.props.dispatch(actions.moveBack());
    }

    handleEndClicked() {
        this.props.dispatch(actions.endSetup());
    }

    handleCancelClicked() {
        this.props.dispatch(actions.cancelSetup());
    }

    render() {
        const panel = (
            <div>
                <p style={{marginTop: 32}}>Cate Desktop is now ready to be used. Thanks for your patience!</p>

                {/*<p style={{marginTop: 32}}>Cate Desktop can keep its <code>cate</code> Python package*/}
                {/*up-to-date automatically.</p>*/}

                {/*<div style={{marginLeft: 32}}>*/}
                {/*<Checkbox label="Automatically update Cate Python package"*/}
                {/*checked={this.props.autoUpdateCate}*/}
                {/*onChange={(event: any) => this.props.dispatch(actions.setAutoUpdateCate(event.target.checked))}/>*/}
                {/*</div>*/}

                <p style={{marginTop: 64}}>Click <strong>End</strong> to close setup and start Cate Desktop.</p>
            </div>
        );

        return (
            <SetupScreen title="Setup Successful"
                         panel={panel}
                         noNextButton={this.props.setupStatus !== SETUP_STATUS_SUCCEEDED}
                         nextButtonLabel={'End'}
                         nextButtonIcon={'tick-circle'}
                         nextButtonIntent={Intent.SUCCESS}
                         onBackButtonClick={this.handleBackClicked}
                         onNextButtonClick={this.handleEndClicked}
                         onCancelClick={this.handleCancelClicked}
            />
        );
    }
}

export const EndScreen = connect(mapStateToProps)(_EndScreen);
