FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace @chainpulse/server --include-workspace-root \
  && npm cache clean --force

COPY server server

USER node
EXPOSE 5000
CMD ["npm", "start"]
