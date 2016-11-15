import * as React from 'react'

export function HGLContainer(props) {
    return createHGLElement('hgl-container', props);
}

export function HGLHeader(props) {
    return createHGLElement('hgl-header', props);
}

export function HGLFooter(props) {
    return createHGLElement('hgl-footer', props);
}

export function HGLLeft(props) {
    return createHGLElement('hgl-left', props);
}

export function HGLRight(props) {
    return createHGLElement('hgl-right', props);
}

export function HGLMidsection(props) {
    return createHGLElement('hgl-midsection', props);
}

export function HGLCenter(props) {
    return createHGLElement('hgl-center', props);
}

function createHGLElement(className: string, props) {
    return (
        <div className={className}>
            {props.children}
        </div>
    );
}

