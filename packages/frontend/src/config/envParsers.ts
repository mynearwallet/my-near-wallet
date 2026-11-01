export const envValIsSet = (envVal: string | any): boolean => typeof envVal === 'string';

export const parseBooleanFromShell = (envVal: string | any): boolean | undefined =>
    envValIsSet(envVal) ? envVal === 'yes' || envVal === 'true' : undefined;

export const parseObjectFromShell = (
    envVal: Object | any
): Record<any, any> | undefined => {
    try {
        return JSON.parse(envVal);
    } catch (error) {
        return undefined;
    }
};

// GitHub Actions passes an empty string for an unset `vars.*`, so blank means "use the default".
export const parseSunsetPhaseFromShell = (
    envVal: string | any
): 1 | 2 | 3 | undefined => {
    if (!envValIsSet(envVal) || envVal.trim() === '') {
        return undefined;
    }

    const phase = Number(envVal.trim());
    if (phase !== 1 && phase !== 2 && phase !== 3) {
        throw new Error(`Invalid SUNSET_PHASE "${envVal}": expected 1, 2 or 3`);
    }

    return phase;
};

export const parseCommaSeperatedStringAsArrayFromShell = (
    envVal: string | any
): string[] | undefined => (envValIsSet(envVal) ? envVal.split(',') : undefined);
