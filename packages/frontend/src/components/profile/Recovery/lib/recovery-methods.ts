export type RecoveryMethod = {
    kind: string;
    confirmed: boolean;
    createdAt: string;
}

export const createUserRecoveryMethodsMap = (
    listOfMethods: { kind: string }[]
): Record<string, RecoveryMethod> =>
    Array.isArray(listOfMethods) ? listOfMethods.reduce((map, method) => {
        map[method.kind] = method;

        return map;
    }, {}) : {};
