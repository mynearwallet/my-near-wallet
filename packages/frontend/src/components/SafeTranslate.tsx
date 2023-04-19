import escapeHtml from "escape-html";
import isArray from "lodash.isarray";
import isPlainObject from "lodash.isplainobject";
import isString from "lodash.isstring";
import mapValues from "lodash.mapvalues";
import React from "react";
import { Translate } from "react-localize-redux";

function processDataValue(value) {
  // 99% of the time we'll just have a single `data` string
  if (isString(value)) {
    return escapeHtml(value);
  }

  // Sometimes we may have a hashmap containing multiple variables to interpolate
  if (isPlainObject(value)) {
    return mapValues(value, (v) => processDataValue(v));
  }

  // Sometimes we may be provided an array of unknown values
  if (isArray(value)) {
    return value.map((val) => processDataValue(val));
  }

  // Otherwise we're gonna leave it well enough alone
  return value;
}

interface Props {
    id: string
    children?: any
    data?: any
}

const SafeTranslate: React.FunctionComponent<Props> = ({ children, id, data,...origProps }) => {
  const props = {
    ...origProps,
    id,
    data: processDataValue(data),
  };

  return <Translate {...props}>{children}</Translate>;
}

export default SafeTranslate
