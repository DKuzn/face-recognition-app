FROM node:16-alpine as build
WORKDIR /app
COPY package.json /app/package.json
RUN export NODE_OPTIONS=--openssl-legacy-provider
RUN npm install
COPY public /app/public/
COPY src /app/src/
RUN npm run build

FROM node:16-alpine

WORKDIR /app
COPY --from=build /app/build /app/build
COPY package.json /app/package.json
COPY server.js /app
RUN npm install --only=prod

ENTRYPOINT ["npm", "run", "serve"]