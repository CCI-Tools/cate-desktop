import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
    HGLContainer, HGLHeader, HGLFooter,
    HGLMidsection2
} from './components';

export function main() {
    let leftStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflowY: "auto",
    };
    let rightStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflowY: "auto",
    };
    let centerStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "auto",
    };
    ReactDOM.render(
        <HGLContainer>
            <HGLHeader>
                <p>HEADER</p>
            </HGLHeader>
            <HGLMidsection2 leftWidth={100} rightWidth={100}>
                <div style={leftStyle}>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                </div>
                <div style={centerStyle}>
                    <img src="resources/SST.png"/>
                </div>
                <div style={rightStyle}>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                </div>
            </HGLMidsection2>
            <HGLFooter>
                <p>FOOTER</p>
            </HGLFooter>
        </HGLContainer>,
        document.getElementById('container')
    );
}


