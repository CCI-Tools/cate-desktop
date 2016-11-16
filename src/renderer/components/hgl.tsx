import * as React from 'react'

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

interface HGLMidsectionProps {
    leftWidth: number;
    leftHidden?: boolean;
    rightWidth: number;
    rightHidden?: boolean;
}

interface HGLMidsectionState {
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
                <HGLHorSplitter onDelta={this.onDeltaLeft}/>
                <HGLCenter>{centerElement}</HGLCenter>
                <HGLHorSplitter onDelta={this.onDeltaRight}/>
                <HGLRight style={rightStyle}>{rightElement}</HGLRight>
            </div>
        );
    }
}


interface HGLSplitterProps {
    onDelta: (delta: number) => any;
}

// TODO: add splitter width, color, etc. style props

export class HGLHorSplitter extends React.Component<HGLSplitterProps, any> {
    mouseX: null | number = null;
    bodyEventListeners: Array<[string, (any) => any]>;

    constructor(props: HGLSplitterProps) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onBodyMouseMove = this.onBodyMouseMove.bind(this);
        this.onBodyMouseUp = this.onBodyMouseUp.bind(this);
        this.onBodyMouseEnter = this.onBodyMouseEnter.bind(this);
        this.onBodyMouseLeave = this.onBodyMouseLeave.bind(this);
        this.bodyEventListeners = [
            ['mousemove', this.onBodyMouseMove],
            ['mouseup', this.onBodyMouseUp],
            ['onmouseenter', this.onBodyMouseEnter],
            ['onmouseleave', this.onBodyMouseLeave],
        ];
    }

    private onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
        let button1 = event.button === 0 && event.buttons === 1;
        if (button1) {
            this.mouseX = event.screenX;
            this.removeBodyMouseListeners();
            this.addBodyMouseListeners();
        } else {
            this.mouseX = null;
        }
    }

    private onBodyMouseMove(event: MouseEvent) {
        let button1 = event.button === 0 && event.buttons === 1;
        if (this.mouseX === null || !button1) {
            return;
        }
        let deltaX = event.screenX - this.mouseX;
        this.mouseX = event.screenX;
        if (deltaX != 0) {
            this.props.onDelta(deltaX);
        }
    }

    private onBodyMouseUp(event: MouseEvent) {
        // console.log("onBodyMouseUp: ", event, this);
        this.endDragging();
    }

    private onBodyMouseEnter(event: MouseEvent) {
        // console.log("onBodyMouseEnter: ", event, this);
        this.endDragging();
    }

    private onBodyMouseLeave(event: MouseEvent) {
        // console.log("onBodyMouseLeave: ", event, this);
        this.endDragging();
    }

    private endDragging() {
        this.removeBodyMouseListeners();
        this.mouseX = null;
    }

    private addBodyMouseListeners() {
        this.bodyEventListeners.forEach((pair: [string, (any) => any]) =>
            document.body.addEventListener(pair[0], pair[1]));
    }

    private removeBodyMouseListeners() {
        this.bodyEventListeners.forEach((pair: [string, (any) => any]) =>
            document.body.removeEventListener(pair[0], pair[1]));
    }

    componentWillUnmount() {
        this.removeBodyMouseListeners();
    }

    render() {
        return (
            <div
                className="hgl-hor-splitter"
                onMouseDown={this.onMouseDown}
            />
        );
    }
}
