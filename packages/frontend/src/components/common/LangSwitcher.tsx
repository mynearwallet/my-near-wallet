import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { withLocalize } from 'react-localize-redux';

import { targetValue } from '../../shared/lib/forms/selectors';

type ActiveLanguage = {
    active: boolean,
    code: string,
    name?: string
}

type LanguageSwitcherProps = {
    activeLanguage: ActiveLanguage,
    languages: ActiveLanguage[],
    setActiveLanguage: (langCode: string) => void
}

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ languages, activeLanguage, setActiveLanguage }) => {
    const { i18n } = useTranslation();

    const handleChange = useCallback((code) => {
        // @migration to i18next
        i18n.changeLanguage(code);

        // @deprecated react-localize-redux
        setActiveLanguage(code);
    }, []);

    return (
        <select
            className="lang-selector"
            name="lang"
            value={activeLanguage && activeLanguage.code}
            onChange={targetValue(handleChange)}
        >
            {languages.map(({ name, code }) => (
                <option key={code} value={code}>
                    {name}
                </option>
            ))}
        </select>
    );
};

export default withLocalize(LanguageSwitcher);
