FROM alpine:3.9

ENV HUGO_VERSION=0.55.5
ENV BSYNC_VERSION=0.1.0

RUN apk add --no-cache \
  bash \
  nodejs \
  npm \
  zip \
  curl

WORKDIR /tmp

RUN curl -L https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz | tar -xz && \
  curl -L https://github.com/zhikiri/bsync/releases/download/v${BSYNC_VERSION}/${BSYNC_VERSION}-Linux-amd64.tar.gz | tar -xz

WORKDIR /app

COPY package*.json /app/

RUN npm i -g typescript && npm i
COPY . .

RUN npm run compile && ./build.sh

CMD ["bash", "-c"]
