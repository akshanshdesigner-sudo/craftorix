const { isAuthenticated, json } = require('./_lib');

exports.handler = async (event) => {
  return json(200, { authenticated: isAuthenticated(event) });
};
