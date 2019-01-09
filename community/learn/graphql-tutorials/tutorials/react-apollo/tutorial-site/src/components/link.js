import React from "react";
import { Link as GatsbyLink, withPrefix } from "gatsby";
import isAbsoluteUrl from "is-absolute-url";

const Link = ({ to, ...props }) =>
  isAbsoluteUrl(to) ? (
    <a href={to} {...props} />
  ) : (
    <GatsbyLink to={withPrefix(to)} {...props} />
  );

export default Link;
