const { query } = require('graphqurl@0.3.2');
module.exports = function (user, context, cb) {
  // Perform any asynchronous actions, e.g. send notification to Slack.
  let userIdPrefix = 'auth0|';
  if (context.connection.name !== 'Username-Password-Authentication') {
    userIdPrefix = 'google-oauth2|';
  }
  query(
    {
      query: `
        mutation($userId: String!, $nickname: String) {
          insert_users(
            objects: [{ auth0_id: $userId, name: $nickname }]
            on_conflict: {
              constraint: users_pkey
              update_columns: [last_seen, name]
            }
          ) {
            affected_rows
          }
        }
      `,
      endpoint: 'http://backend.graphql-tutorials.org/v1alpha1/graphql',
      headers: {
        'x-hasura-access-key': '<replace-with-access-key'
      },
      variables: {
        userId: userIdPrefix + user.id,
        nickname: user.email.split('@')[0]
      }
    }
  ).then((response) => {
      cb();
    })
   .catch((error) => {
     console.error(error);
     cb();
  });
};
