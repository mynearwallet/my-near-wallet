import { RELEASE_NOTES_MODAL_VERSION } from './wallet';

type BreakingChangeType = {
    version: number;
    patch: () => void;
};

// All breaking change that modified the local storage and cause old save file
// not working should register their patches here!
const BREAKING_CHANGES: BreakingChangeType[] = [];

function parseVersion(version: string): number {
    const versions = version.replace(/[^0-9.]/g, '').split('.');

    return versions.reduce(
        (accumulator, currentValue) => accumulator * 100 + parseInt(currentValue, 10),
        0
    );
}

export function exportData(): string {
    const data = {
        version: RELEASE_NOTES_MODAL_VERSION,
        localStorage,
    };

    return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function importData(exportString: string): void {
    const { version: exportVersion, localStorage: exportData } = JSON.parse(
        decodeURIComponent(atob(exportString))
    );

    const version = parseVersion(exportVersion);

    for (const [key, value] of Object.entries(exportData)) {
        localStorage.setItem(key as string, value as string);
    }

    BREAKING_CHANGES.filter((x) => x.version > version)
        .sort((x, y) => x.version - y.version)
        .forEach((breakingChange: BreakingChangeType): void => breakingChange.patch());
}
