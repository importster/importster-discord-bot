# FROM（ベースイメージを指定）
FROM node:latest

# Create the bot's directory
RUN mkdir -p /usr/src/bot

# WORKDIR（作業ディレクトリの指定）
WORKDIR /usr/src/bot

# COPY（ローカルファイルをコンテナ内コピーする）
# COPY ./bot /usr/src/bot
# RUN（コマンドを実行する）
# RUN npm install

# Start the bot.
CMD ["node", "index.js"]