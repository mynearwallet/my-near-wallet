// import { RELEASE_NOTES_MODAL_VERSION } from './wallet';

// // This function will convert the version to number
// // So that we can compare 2 different versions
// function parseVersion(version: string): number {
//     const [versions] = version.replace(/[^0-9.]/g, '');

//     return versions.reduce(
//         (accumulator, currentValue) => accumulator * 100 + currentValue,
//         0
//     );
// }

export function exportData(): string {
    const data = {
        version: RELEASE_NOTES_MODAL_VERSION,
        localStorage,
    };

    return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function importData(importString: string): void {}
