import React from "react";
import classNames from "../../../../utils/classNames";
import StyledContainer from "./css/Style.css";
import { useTranslation } from "react-i18next";

interface Props {
  translateIdTitle: string;
  informationValue: string;
  className?: string;
  onClick: () => void;
}

export const Information: React.FunctionComponent<Props> = ({
  className,
  translateIdTitle,
  informationValue,
  onClick,
}) => {
  /* TODO: Handle long informationValue */
  const { t } = useTranslation();

  return (
    <StyledContainer
      className={classNames(["information", className, { clickable: onClick }])}
      onClick={onClick}
    >
      {t(translateIdTitle)}
      <div>{informationValue}</div>
    </StyledContainer>
  );
};
