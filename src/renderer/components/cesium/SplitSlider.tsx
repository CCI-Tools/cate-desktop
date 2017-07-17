import * as React from "react";

export interface ISliderProps {
    splitPos: number;
    onChange: (splitPosition: number) => void;
    visible?: boolean;
}

export class SplitSlider extends React.PureComponent<ISliderProps, null> {
    static readonly DIV_STYLE: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        top: '0px',
        backgroundColor: 'rgba(255, 255, 0, 0.5)',
        width: '2px',
        height: '100%',
        zIndex: 50,
        cursor: 'col-resize',
    };

    sliderElement: HTMLDivElement | null;
    dragStartX: number;

    constructor(props: ISliderProps) {
        super(props);
        this.handleRef = this.handleRef.bind(this);
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.sliderMove = this.sliderMove.bind(this);
    }

    mouseDown(e) {
        this.dragStartX = e.clientX - this.sliderElement.offsetLeft;
        window.addEventListener('mousemove', this.sliderMove, true);
    }

    mouseUp() {
        window.removeEventListener('mousemove', this.sliderMove, true);
    }

    sliderMove(e) {
        const splitPosition = (e.clientX - this.dragStartX) / this.sliderElement.parentElement.offsetWidth;
        this.props.onChange(splitPosition);
    }

    handleRef(sliderElement: HTMLDivElement) {
        if (sliderElement) {
            sliderElement.addEventListener('mousedown', this.mouseDown, false);
            window.addEventListener('mouseup', this.mouseUp, false);
            this.dragStartX = 0;
        } else if (this.sliderElement) {
            this.sliderElement.removeEventListener('mousedown', this.mouseDown, false);
        }
        this.sliderElement = sliderElement;
    }

    render() {
        if (!this.props.visible) {
            return null;
        }
        const left = (100 * this.props.splitPos) + '%';
        return (<div style={{...SplitSlider.DIV_STYLE, left}}
                     ref={this.handleRef}/>);
    }
}


