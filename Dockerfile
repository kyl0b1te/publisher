FROM alpine:3.9

RUN apk add --no-cache \
  bash \
  nodejs \
  npm \
  zip \
  unzip \
  python \
  py-pip \
  groff \
  less

RUN pip install awscli && npm i -g typescript

WORKDIR /app

COPY package*.json /app/

RUN npm i

COPY . .

RUN npm run compile && \
  rm -rf node_modules && \
  npm ci --only=production && \
  zip -r lambda.blog-publisher.zip lambda.js dist/ bin/ node_modules/

CMD ["bash"]
