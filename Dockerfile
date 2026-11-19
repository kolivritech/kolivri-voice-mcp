FROM node:22-alpine
WORKDIR /app
COPY package.json LICENSE ./
COPY src ./src
ENV NODE_ENV=production
ENTRYPOINT ["node", "src/server.mjs"]
