import React from "react";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

interface Props {
    receiverId: string
    translateIdTitle: string
}

export const Receiver = ({ receiverId, translateIdTitle }) => {
  /* TODO: Handle long Account ID & Add icon */
  const { t } = useTranslation()

  return (
    <StyledContainer>
      {t(translateIdTitle)}
      <div className='receiver'>{receiverId}</div>
    </StyledContainer>
  );
};
