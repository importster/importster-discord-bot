FROM node:latest

RUN mkdir -p /usr/src/bot

WORKDIR /usr/src/bot

CMD ["node", "index.js"]