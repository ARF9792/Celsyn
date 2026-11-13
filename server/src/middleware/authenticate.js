import { publicUserFromToken, verifyAccessToken } from "../services/auth-service.js";

export const authenticateRequest = (request, response, next) => {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ error: "Authentication required" });
  }

  try {
    request.user = publicUserFromToken(verifyAccessToken(token));
    return next();
  } catch {
    return response.status(401).json({ error: "Session is invalid or expired" });
  }
};

