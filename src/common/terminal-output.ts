export interface LineType<L> {
    newLine(): L;

    getLastLineText(lines: L[]): string;

    setLastLineText(lines: L[], text: string);
}

export type TextLine = string;

export class TextLineType implements LineType<TextLine> {

    newLine(): TextLine {
        return '';
    }

    getLastLineText(lines: TextLine[]): string {
        return lines[lines.length - 1];
    }

    setLastLineText(lines: TextLine[], text: string) {
        lines[lines.length - 1] = text;
    }
}

export const TEXT_LINE_TYPE = new TextLineType();

/**
 * Used to convert incoming terminal output messages (e.g. from a conda package installation) that contain ASCII
 * control characters into an array of (HTML) elements.
 */
export function parseTerminalOutput<E>(output: string, lineType: LineType<E>, lines?: E[]): E[] {
    if (!lines || lines.length === 0) {
        lines = [lineType.newLine()];
    }
    const outputLines = output.split('\n');
    if (outputLines && outputLines.length !== 0) { // should always be true
        lines = lines.slice();
        updateLastLineLine(outputLines[0], lineType, lines);
        for (let i = 1; i < outputLines.length; i++) {
            lines.push(lineType.newLine());
            updateLastLineLine(outputLines[i], lineType, lines);
        }
    }
    return lines;
}

function updateLastLineLine<E>(line: string, lineType: LineType<E>, lines?: E[]) {
    const lineParts = line.split('\r');
    if (lineParts && lineParts.length !== 0) { // should always be true
        let text = lineType.getLastLineText(lines);
        for (let linePart of lineParts) {
            if (text.length > linePart.length) {
                text = linePart + text.substr(linePart.length);
            } else {
                text = linePart;
            }
        }
        lineType.setLastLineText(lines, text);
    }
}
