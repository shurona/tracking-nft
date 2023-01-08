# node version 16
FROM node:16 AS builder
WORKDIR /app
COPY . .
RUN yarn
RUN yarn build

RUN echo "#!/bin/sh" > entrypoint.sh && \
    echo "yarn start" >> entrypoint.sh

EXPOSE 3000

CMD ["yarn","start"]

