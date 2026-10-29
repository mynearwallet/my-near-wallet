import { useTranslation } from 'react-i18next';

import { SUNSET_PHASE_3_DATE } from '../../config/sunset';

// MyNearWallet language codes that are not valid BCP 47 tags (or read better as another one).
const LOCALE_BY_LANGUAGE = {
    en: 'en-GB',
    ua: 'uk',
    'zh-hans': 'zh-Hans',
    'zh-hant': 'zh-Hant',
};

/** "1 November" in the reader's language. The date is a calendar day, so it is shown in UTC. */
export const formatSunsetDate = (isoDate, language) => {
    const date = new Date(`${isoDate}T00:00:00Z`);
    try {
        return date.toLocaleDateString(
            LOCALE_BY_LANGUAGE[language] || language || 'en-GB',
            {
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC',
            }
        );
    } catch {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            timeZone: 'UTC',
        });
    }
};

export const usePhase3Date = () => {
    const { i18n } = useTranslation();
    return formatSunsetDate(SUNSET_PHASE_3_DATE, i18n.language);
};
