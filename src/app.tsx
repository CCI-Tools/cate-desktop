import * as React from 'react';
import {Greeter as Greeter, GreeterProps as GreeterProps} from './greeter';

function getRandomGreeting() {
    switch (Math.floor(Math.random() * 4)) {
        case 0: return 'Hello';
        case 1: return 'Howdy';
        case 2: return 'Greetings to you';
        case 3: return 'Hail';
    }
}

function main() {
    let props: GreeterProps = {
        whomToGreet: 'world!',
        greeting: getRandomGreeting
    };

    React.render(<Greeter {...props} />, document.getElementById('output'));
}

main();

