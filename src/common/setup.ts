
export const SETUP_MODE_AUTO = "AUTO";
export const SETUP_MODE_USER = "USER";

export const CATE_MODE_NEW_CATE_DIR = "NEW_CATE_DIR";
export const CATE_MODE_OLD_CATE_DIR = "OLD_CATE_DIR";
export const CATE_MODE_CONDA_DIR = "CONDA_DIR";

export type SetupMode = "AUTO" | "USER";
export type CateMode = "NEW_CATE_DIR" | "OLD_CATE_DIR" | "CONDA_DIR";

export interface SetupOptions {
    setupMode: SetupMode;
    cateMode: CateMode | null;
    newCateDir?: string;
    oldCateDir?: string;
    condaDir?: string;
    keepCateUpToDate: boolean
}
