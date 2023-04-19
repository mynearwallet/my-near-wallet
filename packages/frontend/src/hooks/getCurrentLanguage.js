import { useSelector } from "react-redux";
import { createSelector } from "reselect";

const getLanguages = (state) => state.localize.languages;

const getCurrentLanguage = () => {
  const language = createSelector(getLanguages, (languages) =>
    languages.find((language) => language.active),
  );
  const currentLanguage = useSelector(language);

  return currentLanguage.code;
};

export default getCurrentLanguage;
