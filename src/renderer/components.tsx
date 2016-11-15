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

export class HGLMidsection extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-midsection">
                {this.props.children}
            </div>
        );
    }
}

interface HGLMidsection2Props {
    leftWidth?: number;
    rightWidth?: number;
}

interface HGLMidsection2State {
    leftWidth?: null | number;
    rightWidth?: null | number;
}

export class HGLMidsection2 extends React.Component<HGLMidsection2Props, HGLMidsection2State> {

    constructor(props: HGLMidsection2Props) {
        super(props);
        this.state = {
            leftWidth: null,
            rightWidth: null,
        };

        this.onDeltaLeft = this.onDeltaLeft.bind(this);
        this.onDeltaRight = this.onDeltaRight.bind(this);
    }

    onDeltaLeft(deltaX: number) {
        // console.log('onDeltaLeft: deltaX: ', deltaX, this);
        this.setState((state: HGLMidsection2State, props: HGLMidsection2Props) => {
            return {
                leftWidth: (state.leftWidth || props.leftWidth) + deltaX,
            }
        });
    }

    onDeltaRight(deltaX: number) {
        // console.log('onDeltaRight: deltaX: ', deltaX, this);
        this.setState((state: HGLMidsection2State, props: HGLMidsection2Props) => {
            return {
                rightWidth: (state.rightWidth || props.rightWidth) - deltaX,
            }
        });
    }

    render() {
        let leftElement = this.props.children[0];
        let centerElement = this.props.children[1];
        let rightElement = this.props.children[2];
        let leftStyle = this.state.leftWidth ? {
            width: this.state.leftWidth + "px",
            maxWidth: this.state.leftWidth + "px",
        } : {};
        let rightStyle = this.state.rightWidth ? {
            width: this.state.rightWidth + "px",
            maxWidth: this.state.rightWidth + "px",
        } : {};
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

// read: https://facebook.github.io/react/docs/refs-and-the-dom.html

export class HGLHorSplitter extends React.Component<HGLSplitterProps, any> {
    mouseX: null | number = null;

    constructor(props: HGLSplitterProps) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onBodyMouseUp = this.onBodyMouseUp.bind(this);
        this.onBodyMouseMove = this.onBodyMouseMove.bind(this);
    }

    componentDidMount() {
        // console.log('componentDidMount: ', this);
        document.body.addEventListener('mouseup', this.onBodyMouseUp);
        document.body.addEventListener('mousemove', this.onBodyMouseMove);
    }

    componentWillUnmount() {
        // console.log('componentWillUnmount: ', this);
        document.body.removeEventListener('mouseup', this.onBodyMouseUp);
        document.body.removeEventListener('mousemove', this.onBodyMouseMove);
    }

    onMouseDown(event: React.MouseEvent<HTMLInputElement>) {
        // console.log('onMouseDown: ', event.nativeEvent, this);
        let button1 = event.button === 0 && event.buttons === 1;
        if (button1) {
            this.mouseX = event.screenX;
        } else {
            this.mouseX = null;
        }
    }

    onBodyMouseUp(event: MouseEvent) {
        // console.log('onBodyMouseUp: ', event, this);
        this.mouseX = null;
    }

    onBodyMouseMove(event: MouseEvent) {
        // console.log('onBodyMouseMove: ', event, this);
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

    render() {
        return (
            <input
                type="button"
                className="hgl-hor-splitter"
                onMouseDown={this.onMouseDown}
            >
            </input>
        );
    }
}
