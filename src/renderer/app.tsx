import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {HGLContainer, HGLHeader, HGLFooter, HGLMidsection, HGLLeft, HGLRight, HGLCenter} from './components';

// TODO: we don't have a react-split-pane.d.ts yet, so we must use Node's CommonJS import
// import * as SplitPane from 'react-split-pane';
const SplitPane: any = require('react-split-pane');

{/*<SplitPane defaultSize="40%" split="vertical">*/
}
{/*<div>Left</div>*/
}
{/*<div>Content</div>*/
}
{/*</SplitPane>*/
}

export function main() {
    let imgContainerStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "scroll",
    };
    ReactDOM.render(
        <HGLContainer>
            <HGLHeader>
                <p>HEADER</p>
            </HGLHeader>
            <HGLMidsection>
                <HGLLeft>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                    <p>LEFT</p>
                </HGLLeft>
                <HGLCenter>
                    {/*<div style={style1}>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                        {/*<p>CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER&nbsp;CENTER</p>*/}
                    {/*</div>*/}
                    <div style={imgContainerStyle}>
                        <img src="resources/SST.png"/>
                    </div>
                </HGLCenter>
                <HGLRight>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                    <p>RIGHT</p>
                </HGLRight>
            </HGLMidsection>
            <HGLFooter>
                <p>FOOTER</p>
            </HGLFooter>
        </HGLContainer>,
        document.getElementById('container')
    );
}


