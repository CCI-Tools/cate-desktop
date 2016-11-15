import * as React from 'react'

export class  HGLContainer extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-container">
                {this.props.children}
            </div>
        );
    }
}

export class  HGLHeader extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-header">
                {this.props.children}
            </div>
        );
    }
}

export class  HGLFooter extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-footer">
                {this.props.children}
            </div>
        );
    }
}

export class  HGLLeft extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-left">
                {this.props.children}
            </div>
        );
    }
}

export class  HGLRight extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-right">
                {this.props.children}
            </div>
        );
    }
}


export class  HGLCenter extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-center">
                {this.props.children}
            </div>
        );
    }
}

export class  HGLMidsection extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-midsection">
                {this.props.children}
            </div>
        );
    }
}


interface HGLMidsection2Props {
    left: HGLLeft;
    center: HGLCenter;
    right: HGLRight;
    leftId?: string;
    rightId?: string;
}

export class HGLMidsection2 extends React.Component<HGLMidsection2Props, any> {
    constructor(props: HGLMidsection2Props) {
        super(props);
    }

    render() {
        return (
            <div className="hgl-midsection">
                {this.props.left}
                <HGLHorSplitter panelId={this.props.leftId || 'leftPanel'}/>
                {this.props.center}
                <HGLHorSplitter  panelId={this.props.leftId || 'rightPanel'}/>
                {this.props.right}
            </div>
        );
    }
}


interface HGLHorSplitterProps {
    panelId: string;
}

// read: https://facebook.github.io/react/docs/refs-and-the-dom.html

export class HGLHorSplitter extends React.Component<HGLHorSplitterProps, any> {

    constructor(props: HGLHorSplitterProps) {
        super(props);
        this.onMouseDown.bind(this.onMouseDown, this);
        this.onMouseUp.bind(this.onMouseUp, this);
    }

    componentDidMount() {
        console.log('componentDidMount: ', this);
    }

    componentWillUnmount() {
        console.log('componentWillUnmount: ', this);
    }

    onMouseDown(event: React.MouseEvent<HTMLInputElement>) {
        console.log('onMouseDown: ', event, this);
    }

    onMouseUp(event: React.MouseEvent<HTMLInputElement>) {
        console.log('onMouseUp: ', event, this);
    }

    onMouseMove(event: React.MouseEvent<HTMLInputElement>) {
        console.log('onMouseMove: ', event, this);
    }

    onRef(splitter) {
        console.log('onRef: ', splitter, this);
    }

    render() {
        return (
            <input
                type="button"
                className="hgl-hor-splitter"
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                ref={this.onRef}/>
        );
    }
}
