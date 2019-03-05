FROM node:10.13.0

LABEL maintainer="Federico Feroldi <federico@teamdigitale.governo.it>"

# Create app directory
WORKDIR /usr/src/app

ADD package.json package.json
ADD yarn.lock yarn.lock
ADD tsconfig.json tsconfig.json
ADD src src
RUN yarn install
RUN yarn build

CMD [ "yarn", "start" ]
