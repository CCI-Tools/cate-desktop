
export const SETUP_MODE_AUTO = "AUTO";
export const SETUP_MODE_USER = "USER";

export const SETUP_REASON_INSTALL_CATE = "INSTALL_CATE";
export const SETUP_REASON_UPDATE_CATE = "UPDATE_CATE";

export const CATE_MODE_NEW_CATE_DIR = "NEW_CATE_DIR";
export const CATE_MODE_OLD_CATE_DIR = "OLD_CATE_DIR";
export const CATE_MODE_CONDA_DIR = "CONDA_DIR";

export type SetupReason = "INSTALL_CATE" | "UPDATE_CATE";
export type SetupMode = "AUTO" | "USER";
export type CateMode = "NEW_CATE_DIR" | "OLD_CATE_DIR" | "CONDA_DIR";

export interface SetupInfo {
    oldCateDir?: string;
    newCateDir: string;
    oldCateVersion?: string; // PEP440
    newCateVersion: string;  // PEP440
    setupReason: SetupReason | null;
}

export interface SetupOptions {
    setupMode: SetupMode;
    cateMode: CateMode | null;
    newCateDir?: string;
    oldCateDir?: string;
    condaDir?: string;
    autoUpdateCate: boolean
}

export interface SetupResult {
    cateDir: string;
    cateVersion: string;
}
