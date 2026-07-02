- discord用のbotです
- 好きなgithubリポジトリに新しいリリースが来ていないかを確認するbotです<br>

- 6時と18時に自動的にリリースが確認されます
- 確認の頻度は高めてもいいけど高すぎるとGitHubのAPIの回数制限に引っかかるので注意

## つかいかた
### 1. イメージの作成
```bash
docker build -t discord-bot .
```
### 2. 必要なパッケージのインストール
```bash
npm install
```
  - discord.jsとnode-cronとyamlがインストールされてればいいです
  - discord.jsはv14.xx.xじゃないと動かないので注意

### 3. config.ymlの変更
```yaml
discord-token: "yourtoken"
github-token : "yourtoken"
```
  - yourtokenのところに自分のdiscordのbotとgithubアカウントのトークンを書いてください

### 4. 起動する
```bash
docker compose up
```
  - エラーあったら多分パッケージのバージョンが合ってないとかなんとかだと思う...

### 5. discordの方で設定とかいろいろ
  - !c4460-here でリリース情報の通知をするチャンネルを選びます
  - 
