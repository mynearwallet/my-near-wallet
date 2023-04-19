import React from "react";
import formatTimestampForLocale from "../../../../utils/formatTimestampForLocale";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

interface Props {
  timeStamp: string | number | Date;
  translateIdTitle: string;
}

export const DateAndTime: React.FunctionComponent<Props> = ({ timeStamp, translateIdTitle }) => {
  const { t } = useTranslation();

  return (
    <StyledContainer>
      {t(translateIdTitle)}
      <div className='time'>{formatTimestampForLocale(timeStamp)}</div>
    </StyledContainer>
  );
};
