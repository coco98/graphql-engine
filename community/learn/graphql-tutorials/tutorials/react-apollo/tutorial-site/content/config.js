import React from 'react'
const backendUrl = "https://backend.graphql-tutorials.org/v1alpha1/graphql";

const backendLink = (props) => (
  <React.Fragment>
    <a href={backendUrl}>
        {props.title}
    </a>
  </React.Fragment>
);
const Url = (props) => (
  <React.Fragment>
    {backendUrl}
  </React.Fragment>
);

export default backendLink;

export { Url }

