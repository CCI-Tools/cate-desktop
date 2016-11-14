import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Header, Footer, Section} from './components';

// TODO: we don't have a react-split-pane.d.ts yet, so we must use Node's CommonJS import
// import * as SplitPane from 'react-split-pane';
const SplitPane: any = require('react-split-pane');


export function main() {
    ReactDOM.render(
        <Section>
            <Header>Header</Header>
            <SplitPane defaultSize="40%" split="vertical">
                <div>Left</div>
                <div>Content</div>
            </SplitPane>
            <Footer>Footer</Footer>
        </Section>,
        document.getElementById('container')
    );
}


