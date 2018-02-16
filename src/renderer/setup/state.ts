export const MAX_PANELS = 3;

export interface State {
    panelIndex: number;
    mode: "existing" | "new";
    targetDir: string;
    pythonExe: string;
}
