export type PasswordComplexity = 'none'|'week'|'average'|'strong';

export type Levels = 0|1|2|3;

export const getLevelsFromComplexity = (
    complexity: PasswordComplexity
): Levels => {
    switch (complexity) {
        case 'none':
            return 0;
        case 'week':
            return 1;
        case 'average':
            return 2;
        case 'strong':
            return 3;
    }
};

export const validatePassword = (value: string): PasswordComplexity => {
    const regExpWeak = /[a-z]/;
    const regExpMedium = /\d+/;
    const regExpStrong = /.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/;

    if (!value) {
        return 'none';
    }

    const week = value.match(regExpWeak);
    const average = value.match(regExpMedium);
    const strong = value.match(regExpStrong);

    if (week && average && strong) {
        return 'strong';
    }

    if ((week && average) || (average && strong) || (week && strong)) {
        return 'average';
    }

    if (week || average || strong) {
        return 'week';
    }
};
