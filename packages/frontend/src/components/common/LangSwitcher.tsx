import React, { FC } from 'react';
import { withLocalize } from 'react-localize-redux';

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
    return (
        <select
            className="lang-selector"
            name="lang"
            value={activeLanguage && activeLanguage.code}
            onChange={(e) => setActiveLanguage(e.target.value)}
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
