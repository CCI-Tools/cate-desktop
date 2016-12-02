import * as React from 'react'
import {Splitter} from "../components/Splitter";


// TODO: support the leftHidden, rightHidden props

export interface IRowLayoutProps {
    leftWidth: number;
    leftHidden?: boolean;
    rightWidth: number;
    rightHidden?: boolean;
}

export interface IRowLayoutState {
    leftWidth?: null | number;
    rightWidth?: null | number;
}

export class RowLayout extends React.Component<IRowLayoutProps, IRowLayoutState> {

    constructor(props: IRowLayoutProps) {
        super(props);
        this.state = {
            leftWidth: props.leftWidth,
            rightWidth: props.rightWidth,
        };
        this.onLeftSplitDelta = this.onLeftSplitDelta.bind(this);
        this.onRightSplitDelta = this.onRightSplitDelta.bind(this);
    }

    private onLeftSplitDelta(deltaX: number) {
        // console.log('onDeltaLeft: deltaX: ', deltaX, this);
        this.setState((state: IRowLayoutState, props: IRowLayoutProps) => {
            return {
                leftWidth: state.leftWidth + deltaX,
            };
        });
    }

    private onRightSplitDelta(deltaX: number) {
        // console.log('onDeltaRight: deltaX: ', deltaX, this);
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IRowLayoutState, props: IRowLayoutProps) => {
            return {
                rightWidth: state.rightWidth - deltaX,
            };
        });
    }

    render() {
        let leftElement = this.props.children[0];
        let centerElement = this.props.children[1];
        let rightElement = this.props.children[2];
        let leftStyle = {
            width: this.state.leftWidth + "px",
            maxWidth: this.state.leftWidth + "px",
        };
        let rightStyle = {
            width: this.state.rightWidth + "px",
            maxWidth: this.state.rightWidth + "px",
        };
        return (
            <div className="hgl-midsection">
                <RowLayoutLeft style={leftStyle}>{leftElement}</RowLayoutLeft>
                <Splitter splitType="col" onDelta={this.onLeftSplitDelta}/>
                <RowLayoutCenter>{centerElement}</RowLayoutCenter>
                <Splitter splitType="col" onDelta={this.onRightSplitDelta}/>
                <RowLayoutRight style={rightStyle}>{rightElement}</RowLayoutRight>
            </div>
        );
    }
}

export class RowLayoutLeft extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-left" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}

export class RowLayoutRight extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-right" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}


class RowLayoutCenter extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-center" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}
