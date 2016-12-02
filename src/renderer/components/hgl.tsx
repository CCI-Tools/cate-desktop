import * as React from 'react'
import {Splitter} from "./Splitter";

export class HGLContainer extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-container">
                {this.props.children}
            </div>
        );
    }
}

export class HGLHeader extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-header">
                {this.props.children}
            </div>
        );
    }
}

export class HGLFooter extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-footer">
                {this.props.children}
            </div>
        );
    }
}


export class HGLLeft extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-left" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}

export class HGLRight extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-right" style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}


export class HGLCenter extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-center">
                {this.props.children}
            </div>
        );
    }
}

// TODO: support the leftHidden, rightHidden props

export interface HGLMidsectionProps {
    leftWidth: number;
    leftHidden?: boolean;
    rightWidth: number;
    rightHidden?: boolean;
}

export interface HGLMidsectionState {
    leftWidth?: null | number;
    rightWidth?: null | number;
}


export class HGLMidsection extends React.Component<HGLMidsectionProps, HGLMidsectionState> {

    constructor(props: HGLMidsectionProps) {
        super(props);
        this.state = {
            leftWidth: props.leftWidth,
            rightWidth: props.rightWidth,
        };
        this.onDeltaLeft = this.onDeltaLeft.bind(this);
        this.onDeltaRight = this.onDeltaRight.bind(this);
    }

    private onDeltaLeft(deltaX: number) {
        // console.log('onDeltaLeft: deltaX: ', deltaX, this);
        this.setState((state: HGLMidsectionState, props: HGLMidsectionProps) => {
            return {
                leftWidth: state.leftWidth + deltaX,
            };
        });
    }

    private onDeltaRight(deltaX: number) {
        // console.log('onDeltaRight: deltaX: ', deltaX, this);
        this.setState((state: HGLMidsectionState, props: HGLMidsectionProps) => {
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
                <HGLLeft style={leftStyle}>{leftElement}</HGLLeft>
                <Splitter direction="hor" onChange={this.onDeltaLeft}/>
                <HGLCenter>{centerElement}</HGLCenter>
                <Splitter direction="hor" onChange={this.onDeltaRight}/>
                <HGLRight style={rightStyle}>{rightElement}</HGLRight>
            </div>
        );
    }
}

