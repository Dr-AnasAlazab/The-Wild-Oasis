const { auth } = require("./app/_lib/auth");

export const middleware = auth;
export const config = {
  matcher: ["/account"],
};
