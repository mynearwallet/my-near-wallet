import React from "react";
import styled from "styled-components";

const StyledInput = styled.input`
    text-align: center;
    font-weight: 600;
    padding: 0;
    height: auto;
    border: 0;
    background-color: white;

    :focus {
        border: 0;
        box-shadow: none;
    }

    ::placeholder {
        color: #CCCCCC;
    }

    &.error {
        color: #FC5B5B;
    }
`;

const getFontSize = (charLength: number): number => {
  let baseSize = 70;

  if (charLength > 5) {
    baseSize = 60;
  }

  if (charLength > 10) {
    baseSize = 50;
  }

  if (charLength >= baseSize) {
    charLength = baseSize - 6;
  }
  const fontSize = baseSize - charLength;
  return fontSize;
};

interface Props {
  value: string;
  error: string;
  autoFocus?: boolean;
  maxLength?: number;
  onChange: (event: any) => void;
}

export const AmountInput: React.FunctionComponent<Props> = ({
  value,
  onChange,
  error,
  autoFocus = true,
  maxLength = 18,
}) => {
  return (
    <StyledInput
      className={error ? "error" : ""}
      style={{ fontSize: `${value.length ? getFontSize(value.length) : 70}px` }}
      type='number'
      step='any'
      placeholder='0'
      data-test-id="sendMoneyAmountInput"
      value={value}
      onChange={(event) => {
        const { value, maxLength } = event.target;

        if (maxLength && value.length > maxLength) {
          return false;
        }

        onChange(event);
      }}
      autoFocus={!value ? autoFocus : false}
      maxLength={maxLength}
    />
  );
};
