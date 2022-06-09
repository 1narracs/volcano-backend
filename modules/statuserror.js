// Creates custom errors with status codes
exports.statusError = function (message, code) {
  console.log(message, code);
  const serror = new Error(message);
  serror.code = code;
  return serror;
};
