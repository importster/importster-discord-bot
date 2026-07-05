const { Client, Collection, GatewayIntentBits, Events, Partials, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const YAML = require('yaml');
const fs = require('fs');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
	],
	partials: [
		Partials.User,
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.Reaction,
		Partials.GuildScheduledEvent,
		Partials.ThreadMember,
	],
});

//----------------------------------------------------------------log
const LOG_FILE = './log.txt';
const OP_LOG_FILE = './op-log.txt';
const Logger = (message, isError = false ,op = false) => {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    //const prefix = isError ? '[ERROR]' : '[INFO]';
    const logLine = `[${now}]  ${message}\n`;
    
    if (isError) {
        console.error(logLine.trim());
    } else {
        console.log(logLine.trim());
    }
    if(op){
        fs.appendFileSync(OP_LOG_FILE, logLine, 'utf8');
    }else{
        fs.appendFileSync(LOG_FILE, logLine, 'utf8');
    }
};
Logger('----------------------------------');

//----------------------------------------------------------------escape
const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    
    let escaped = str.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    
    return escaped.replace(/[&<>'"\\]/g, (match) => {
        const escapeMap = {
            '\\': '\\',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return escapeMap[match];
    });
};

//----------------------------------------------------------------credentials.yml
const CREDENTIALS_FILE = './credentials.yml';
let credentials = {};
if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
        credentials = YAML.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
        //Logger('[load] credentials.yml');
    } catch (e) {
        Logger(`[error] credentials.yml : ${e.message}`, true);
    }
}

//----------------------------------------------------------------repository.yml
const REPOSITORY_FILE = './repository.yml';
let repoYaml;
let repoJson;
const loadRepoFile = () => {
    if (fs.existsSync(REPOSITORY_FILE)) {
        try {
            repoYaml = YAML.parseDocument(fs.readFileSync(REPOSITORY_FILE, 'utf8')).contents || {};
            repoJson = repoYaml.toJSON();
            //Logger(`[load] repository.yml`);
        } catch (e) {
            Logger(`[error] repository.yml : ${e.message}`, true);
        }
    }
    return {};
};

const saveRepoFile = () => {
    const yamlString = YAML.stringify(repoYaml, { 
        collectionStyle: 'block',
        defaultStringType: 'PLAIN'
    });
    fs.writeFileSync(REPOSITORY_FILE, yamlString, 'utf8');
    Logger('[save] repository.yml');
};
//----------------------------------------------------------------config.yml
const CONFIG_FILE = './config.yml';
let configYaml;
let configJson;
const loadConfigFile = () => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            configYaml = YAML.parseDocument(fs.readFileSync(CONFIG_FILE, 'utf8')).contents || {};
            configJson = configYaml.toJSON();
            //Logger(`[load] repository.yml`);
        } catch (e) {
            Logger(`[error] repository.yml : ${e.message}`, true);
        }
    }
    return {};
};

const saveConfigFile = () => {
    const yamlString = YAML.stringify(configYaml, { 
        collectionStyle: 'block',
        defaultStringType: 'QUOTE_DOUBLE',
        lineWidth: 0
    });
    fs.writeFileSync(CONFIG_FILE, yamlString, 'utf8');
    Logger('[save] config.yml');
};

//----------------------------------------------------------------release.yml
const RELEASE_FILE = './release.yml';
let releaseYaml;
let releaseJson;
const loadRelease = () => {
    if (fs.existsSync(RELEASE_FILE)) {
        try {
            releaseYaml = YAML.parseDocument(fs.readFileSync(RELEASE_FILE, 'utf8')).contents;
            releaseJson = releaseYaml.toJSON();
            //Logger('[load] release.yml');
            } catch (e) {
            Logger(`[error] release.yml : ${e.message}`, true);
        }
    }
    return {};
};

const saveReleaseFile = () => {
    const yamlString = YAML.stringify(releaseJson, { 
        //collectionStyle: 'flow',
        collectionStyle: 'block',
        defaultStringType: 'QUOTE_DOUBLE',
        lineWidth: 0
    });
    fs.writeFileSync(RELEASE_FILE, yamlString, 'utf8');
    Logger('[save] release.yml');
};

//----------------------------------------------------------------release-log.txt
const RELEASE_LOG_FILE = './release-log.txt';
const logNewRelease = (repo, newInfo, ) => {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const logMessage = `[${now}] Repo: ${repo} | ID: ${newInfo.id || 'N/A'} | Name: ${newInfo.name || 'N/A'} | createdAt: ${newInfo.created_at || 'N/A'} | updatedAt: ${newInfo.updated_at || 'N/A'} | body: ${newInfo.body || 'N/A'}\n`;
    
    fs.appendFileSync(RELEASE_LOG_FILE, logMessage, 'utf8');
    Logger(`[save] release-log.txt`);
};

//----------------------------------------------------------------checkGitHubReleases
async function checkGitHubReleases(targetChannel = null) {
    loadRepoFile();
    loadRelease();
    loadConfigFile();
    let channel = targetChannel;
    
    if (!channel && configJson.target_channel_id) {
        channel = await client.channels.fetch(configJson.target_channel_id).catch((e) => Logger(e.message, true));
    }

    if (!channel) {
        Logger('[error] channel not found', true);
        return null;
    }

    Logger('[start] checkRelease');
    let lereaseCount = 0;
    let updateCount = 0;

    for (const repo of repoJson.repository) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
                headers: {
                    'Authorization': `token ${credentials['github-token']}`,
                    'User-Agent': 'Discord-Release-Bot'
                }
            });

            if (!response.ok) {
                if (response.status === 404) continue;
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const latestRelease = await response.json();
            const latestReleaseId = latestRelease.id.toString();
            const latestReleaseupdated_at = latestRelease.updated_at.toString();

            //const savedRepoInfo = JSON.stringify(releaseYaml.get("releases").get(`${repo}`)) || {};
            const savedRepoInfo = releaseJson.releases[`${repo}`] || {};

            const escapedRepoName = escapeHtml(repo);
            const releaseName = latestRelease.name || latestRelease.tag_name;

            if (savedRepoInfo.id !== latestReleaseId || !savedRepoInfo.updated_at || savedRepoInfo.updated_at !== latestReleaseupdated_at) {
                
                logNewRelease(escapedRepoName, {
                    id: escapeHtml(latestReleaseId),
                    name: escapeHtml(releaseName),
                    created_at: escapeHtml(latestRelease.created_at),
                    updated_at: escapeHtml(latestRelease.updated_at),
                    body : escapeHtml(latestRelease.body)
                });

                releaseJson.releases[`${escapedRepoName}`] = {
                    id: escapeHtml(latestReleaseId),
                    updated_at: escapeHtml(latestRelease.updated_at)
                };
                //releaseYaml.get("releases").set(new YAML.Scalar(`${escapedRepoName}`))
                //releaseYaml.get("releases").setIn([`${escapedRepoName}`],new YAML.YAMLMap())
                //releaseYaml.get("releases").get(`${escapedRepoName}`).setIn([new YAML.Scalar("id")],new YAML.Scalar(escapeHtml(latestReleaseId)))
                //releaseYaml.get("releases").get(`${escapedRepoName}`).setIn([new YAML.Scalar("updated_at")],new YAML.Scalar(escapeHtml(latestRelease.updated_at)))

                saveReleaseFile();

                updateCount++;
                Logger(`[update] ${repo}`, false, true);
            }

            if (savedRepoInfo.id !== latestReleaseId) {
               
                const embed = new EmbedBuilder()
                    .setTitle(`【${repo}】`)
                    .setURL(latestRelease.html_url)
                    .setDescription(`**バージョン:** ${latestRelease.tag_name}\n${latestRelease.body ? latestRelease.body.slice(0, 500) + '...' : '詳細な説明はありません。'}`)
                    .setColor('#24292e')
                    .setTimestamp(new Date(latestRelease.published_at));
                await channel.send({ embeds: [embed] });

                lereaseCount++;
                Logger(`[newrelease] ${repo} : ${latestRelease.tag_name}`, false, true);
            }

        } catch (error) {
            Logger(`[error] ${repo} : ${error.message}`, true);
        }
    }
    if(updateCount > 0){
        fs.appendFileSync(RELEASE_LOG_FILE, "\n", 'utf8');
    }
    Logger('[complete] checkReleases');
    
    return { channel, count: lereaseCount };
}


//----------------------------------------------------------------Ready
client.once(Events.ClientReady, () => {
    Logger(`[login] ${client.user.tag}`);

    cron.schedule('0 6,18 * * *', async () => {
        const result = await checkGitHubReleases();
        
        const currentHour = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })).getHours();
        let channel;
    
        if (!channel && configJson.target_channel_id) {
            channel = await client.channels.fetch(configJson.target_channel_id).catch((e) => Logger(e.message, true));
        }
        if (!channel) {
            Logger('[error] channel not found', true);
            return null;
        }

        if (currentHour === 6) {
            Logger('[complete] 6:00');
        } else if (currentHour === 18) {
            Logger('[complete] 18:00');
        }
        
        if (result.count > 0) {
            if (configJson.mention_users && configJson.mention_users.length > 0) {
                const mentions = configJson.mention_users.map(id => `<@${id}>`).join(' ');
            await channel.send(`${mentions} 新しいリリースがあったよ`);
            }
        }
        if (!result) return;
    }, {
        timezone: "Asia/Tokyo"
    });
    
    Logger('[complete] Ready');
});


//----------------------------------------------------------------command
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'Compostar') {
        await message.channel.send(`<@${message.author.id}> 呼んだ？`);
        return;
    }

    if (message.content === '!c4460-here') {
        loadConfigFile();
        if(configJson.target_channel_id === `${message.channel.id}`){
            await message.reply(`今後もここに情報を送るよ`);
            return;
        }
        configYaml.set('target_channel_id',`${message.channel.id}`);
        Logger(`[changechannel] ${message.channel.id}`, false, true);
        saveConfigFile();
        await message.reply(`今後は#${message.channel.name}に情報を送るね`);
        return;
    }

    if (message.content === '!c4460-release') {
        const statusMessage = await message.reply('新しいリリースの確認中...');
        const result = await checkGitHubReleases(message.channel); 
        
        if (result && result.count === 0) {
            await statusMessage.edit('新しいリリースはないよ');
        } else {
            await statusMessage.edit('確認が終わったよ');
        }
    }

    //--------------------------------repository
    if (message.content.startsWith('!c4460-repository ')) {
        loadRepoFile();
        const targetRepo = message.content.slice('!c4460-repository '.length).trim();

        if (!targetRepo || !targetRepo.includes('/')) {
            await message.reply('リポジトリの指定方法が正しくないよ。"所有者/リポジトリ名"の形式で入力してね。');
            return;
        }

        if (repoJson.repository.includes(targetRepo)) {
            await message.reply(`"${targetRepo}"はすでに登録済みだね`);
            return;
        }

        repoYaml.addIn(["repository"], `${targetRepo}`);
        Logger(`[addrepo] ${targetRepo}`, false, true);
        saveRepoFile();

        await message.reply(`"${targetRepo}"を監視リストに追加したよ`);
        return;
    }

    if (message.content.startsWith('!c4460-rm-repository ')) {
        loadRepoFile();
        const targetRepo = message.content.slice('!c4460-rm-repository '.length).trim();

        if (!targetRepo || !targetRepo.includes('/')) {
            await message.reply('リポジトリの指定方法が正しくないよ。"所有者/リポジトリ名"の形式で入力してね。');
            return;
        }

        if (!repoJson.repository.includes(targetRepo)) {
            await message.reply(`"${targetRepo}"が見つからなかったよ`);
            return;
        }        

        YAML.visit(repoYaml, {
            Scalar(key, node) {
                if(node.value === targetRepo) return YAML.visit.REMOVE
            }
        })
        Logger(`[removerepo] ${targetRepo}`, false, true);
        saveRepoFile();

        await message.reply(`"${targetRepo}"を除外したよ`);
        return;
    }

    //--------------------------------me
    if (message.content === '!c4460-me') {
        loadConfigFile();
        const userId = message.author.id;

        if (configJson.mention_users.includes(userId)) {
            await message.reply('登録してあるよ');
            return;
        }

        configYaml.addIn(["mention_users"], `${userId}`);

        Logger(`[adduser] ${userId}`, false, true);
        saveConfigFile();

        await message.reply('おーけぃ、登録したよ');
        return;
    }

    if (message.content === '!c4460-rm-me') {
        loadConfigFile();
        const userId = message.author.id;

        if (!configJson.mention_users.includes(userId)) {
            await message.reply('元から登録されてないよ');
            return;
        }
        
        YAML.visit(configYaml, {
            Scalar(key, node) {
                if(node.value === userId) return YAML.visit.REMOVE
            }
        })
        Logger(`[rmeuser] ${userId}`, false, true);
        saveConfigFile();

        await message.reply('除外しといたよ');
        return;
    }
});

//----------------------------------------------------------------login
client.login(credentials['discord-token']);
