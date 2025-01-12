FROM node:20.18 as builder
RUN apt-get update && apt-get install -y curl git
RUN curl https://install.meteor.com/?release=3.0.4 | sh

# Base image done, pulling sources for build
ENV METEOR_ALLOW_SUPERUSER 1
WORKDIR /build
RUN mkdir appsrc
COPY . /build/appsrc

# Building meteor application
RUN cd appsrc && meteor npm install --omit=dev
RUN cd appsrc && meteor build --directory ../bundle
RUN cd /build/bundle/bundle/programs/server && npm install --omit=dev 
# final stage for running the container, only needs node
FROM node:20.18-slim as final
RUN mkdir /app
COPY --from=builder /build/bundle /app
WORKDIR /app/bundle
EXPOSE 8080

ENTRYPOINT [ "node", "main.js" ]
