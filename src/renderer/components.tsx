import * as React from 'react'

export function Header(props) {
    return (
        <header>
            {props.children}
        </header>
    );
}

export function Footer(props) {
    return (
        <footer>
            {props.children}
        </footer>
    );
}

export function Section(props) {
    return (
        <section className="root">
            {props.children}
        </section>
    );
}

