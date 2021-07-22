# ----- build image -----
FROM node:11.14.0-alpine AS build-env

RUN apk add -U git openssh-client gettext --no-cache
ENV npm_config_unsafe_perm=true

WORKDIR /build

COPY package.json /build
COPY package-lock.json /build
RUN npm config set registry http://registry.npmjs.org/
RUN npm ci --no-optional

COPY . /build

RUN mkdir file \
    && cp -r bin \
             lib \
             spec \
             config.js \
             node_modules \
             package.json \
             file

# ----- production image -----
FROM node:11.14.0-alpine

WORKDIR /app
LABEL maintainer="Tommy Alexandre <tommy.alexandre@thetribe.io>"
COPY --from=build-env /build/file/ /app

RUN apk add --update --no-cache curl

HEALTHCHECK CMD curl --fail http://localhost:8080/version || exit 1
EXPOSE 8080

USER node
ENTRYPOINT [ "npm" ]
CMD [ "start" ]
