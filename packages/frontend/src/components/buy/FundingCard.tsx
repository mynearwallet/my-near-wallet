import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FundingType } from "./FundingType";

const Block = styled.div`
    display: grid;
    border: 1px solid #e5e5e6;
    border-radius: 8px;

    @media (max-width: 992px) {
        grid-template-columns: 1fr 1fr;
        align-content: center;
        grid-gap: 0 32px;
        height: 100%;
    }
    @media (max-width: 580px) {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
    }
`;
const TextWrap = styled.div`
    @media (max-width: 992px) {
        display: grid;
        align-content: center;
        text-align: start;
        margin: 0 0 0 40px;
    }
    @media (max-width: 580px) {
        text-align: center;
        margin: 40px 0 50px;
    }
`;
const Title = styled.div`
    font-size: 20px;
    font-weight: 900;
    text-align: center;
    color: #111618;
    margin-top: 40px;
    @media (max-width: 992px) {
        text-align: start;
        margin: 0;
    }
    @media (max-width: 580px) {
        text-align: center;
    }
`;
const SubTitle = styled.div`
    height: 140px;
    font-size: 16px;
    font-weight: 500;
    color: #72727a;
    text-align: center;
    margin: 16px 28px 0;
    @media (max-width: 992px) {
        height: auto;
        text-align: start;
        margin: 16px 0 0 0;
    }
    @media (max-width: 580px) {
        text-align: center;
        margin: 16px 20px 0;
    }
`;
const Link = styled.div`
    a {
        display: block;
        width: 100%;
        text-align: center;
        margin-top: 20px;
        text-decoration: underline;
        @media (max-width: 992px) {
            text-align: start;
        }
        @media (max-width: 580px) {
            text-align: center;
        }
    }
`;
const FundingTypeWrap = styled.div`
    @media (max-width: 992px) {
        margin: 30px 0;
    }

    @media (max-width: 580px) {
        margin: 0;
    }
`;

interface Props {
  title: string;
  subTitle: string;
  actions: any;
  link?: {
    title: string;
    url: string;
  };
}

export const FundingCard: React.FunctionComponent<Props> = ({ title, subTitle, actions, link }) => {
  const { t } = useTranslation();

  return (
    <Block>
      <TextWrap>
        <Title>{t(title)}</Title>
        <SubTitle>
          {t(subTitle)}
          {link && (
            <Link>
              <a href={link.url} target='_blank' rel='noreferrer'>
                {t(link.title)}
              </a>
            </Link>
          )}
        </SubTitle>
      </TextWrap>
      <FundingTypeWrap>
        {actions.map((action, i) => (
          <FundingType key={`funding-type-${i}`} {...action} />
        ))}
      </FundingTypeWrap>
    </Block>
  );
};
