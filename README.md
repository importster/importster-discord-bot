- discord用のbotです
- 好きなgithubリポジトリに新しいリリースが来ていないかを確認するbotです<br>

- 6時と18時に自動的にリリースが確認されます
- 確認の頻度は高めてもいいけど高すぎるとGitHubのAPIの回数制限に引っかかるので注意<br>
  (トークンなしだと1時間に50回リポジトリの情報を取得するAPIが使えます<br>
  10個のリポジトリを1分に1度監視するコードとかにしてると5分目以降は回数制限で監視できません)<br>
  トークンあると1時間に5000回API使えるけど自分が監視したいリポジトリの数が多いので1日2回にしてます

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
  - discord.jsはv14.x.xじゃないと動かないので注意<br>
  v13になってると絶対に動きません。

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
  - !c4460-here
    - このコマンドを出力した場所がリリース情報の通知をするチャンネルに選ばれます。
  - !c4460-release
    - コマンド出力した場所で直ぐに新しいリリースがないか確認します。
  - !c4460-repository 所有者/リポジトリ名
    - 所有者/リポジトリ名のとこのリポジトリを監視のリストに追加されます。
    - 例えば!c4460-repository importster/importster-discord-bot にするとここのリポジトリが追加されます。
    - 詳しく言うとrepository.ymlに所有者/リポジトリ名が追加されます。

### 6. ファイルについて
- release.yml
  - このファイルにリリースの情報が追加されます
- repository.yml
  - このファイルに新しいリリースを知りたいリポジトリを書きます
- release-old.txt
  - release.ymlの情報が上書きされる際に上書き前の情報がここに追加されます
- log.txt
  - botのコンソール出力がここに書かれます。
  - Loggerが書き込みをしてるのでlog.txtに追加したいlogならconsole.log();じゃなくてLogger();使ってください。
