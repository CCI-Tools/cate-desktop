import * as React from 'react';
import Linkify from 'react-linkify';


export function TextWithLinks(props: any) {
    return <Linkify properties={{target: '_blank'}}>{props.children}</Linkify>;
}
