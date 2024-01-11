import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const getLanguagesList = (state) => state.localize.languages;
const getLanguageSelector = createSelector(getLanguagesList, (languages) =>
    languages.find((language) => language.active)
);

function getCurrentLanguage() {
    const currentLanguage = useSelector(getLanguageSelector);
    return currentLanguage?.code ?? 'en';
}

export default getCurrentLanguage;
