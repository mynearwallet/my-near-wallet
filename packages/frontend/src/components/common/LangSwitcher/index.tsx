import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { withLocalize } from 'react-localize-redux';

import { targetValue } from '../../../shared/lib/forms/selectors';
import { StyledWrapper } from './ui';

type ActiveLanguage = {
    active: boolean;
    code: string;
    name?: string;
};

type LanguageSwitcherProps = {
    activeLanguage: ActiveLanguage;
    languages: ActiveLanguage[];
    setActiveLanguage: (langCode: string) => void;
    isCompact?: boolean;
};

const LangSwitcher: FC<LanguageSwitcherProps> = ({
    languages,
    activeLanguage,
    setActiveLanguage,
    isCompact = false,
}) => {
    const { i18n } = useTranslation();

    const handleChange = useCallback((code: string) => {
        // @migration to i18next
        i18n.changeLanguage(code);

        // @deprecated react-localize-redux
        setActiveLanguage(code);
    }, []);

    return (
        <StyledWrapper isCompact={isCompact}>
            <select
                name="lang"
                value={activeLanguage?.code}
                onChange={targetValue(handleChange)}
            >
                {languages.map(({ name, code }) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
        </StyledWrapper>
    );
};

export default withLocalize(LangSwitcher);
