FROM alpine:3.9

RUN apk add --no-cache \
  bash \
  nodejs \
  npm \
  zip \
  unzip

WORKDIR /app

COPY package*.json /app/

RUN npm i -g typescript && npm i
COPY . .

RUN npm run compile && ./build.sh

CMD ["bash", "-c"]
