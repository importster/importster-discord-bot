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
const Logger = (message, isError = false) => {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const prefix = isError ? '[ERROR]' : '[INFO]';
    const logLine = `[${now}] ${prefix} ${message}\n`;
    
    if (isError) {
        console.error(logLine.trim());
    } else {
        console.log(logLine.trim());
    }
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
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
//----------------------------------------------------------------config.yml
const CONFIG_FILE = './config.yml';
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
    try {
        config = YAML.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        Logger('[load] config.yml');
    } catch (e) {
        Logger(`[error] config.yml : ${e.message}`, true);
    }
}

//----------------------------------------------------------------repository.yml
const REPOSITORY_FILE = './repository.yml';
let repoDoc = new YAML.Document([]);
const loadRepositories = () => {
    if (fs.existsSync(REPOSITORY_FILE)) {
        try {
            repoDoc = YAML.parseDocument(fs.readFileSync(REPOSITORY_FILE, 'utf8'));
            
            if (!repoDoc.contents || typeof repoDoc.contents.toJSON !== 'function') {
                repoDoc.contents = repoDoc.createNode([]);
            }
            Logger(`[load] repository.yml`);
            return repoDoc.contents.toJSON() || [];
        } catch (e) {
            Logger(`[error] repository.yml : ${e.message}`, true);
            return [];
        }
    }
    return [];
};
let REPOSITORIES = loadRepositories();

const saveRepositoryFile = () => {
    fs.writeFileSync(REPOSITORY_FILE, repoDoc.toString(), 'utf8');
    Logger('[save] repository.yml');
};

//----------------------------------------------------------------release.yml
const RELEASE_FILE = './release.yml';
let releaseDoc = new YAML.Document({});
const loadRelease = () => {
    let defaultData = {
        target_channel_id: null, 
        releases: {}             
    };

    if (fs.existsSync(RELEASE_FILE)) {
        try {
            const fileContent = fs.readFileSync(RELEASE_FILE, 'utf8');
            releaseDoc = YAML.parseDocument(fileContent);
            
            const fileData = releaseDoc.contents ? releaseDoc.contents.toJSON() : null;
            
            if (fileData && fileData.releases) {
                return fileData;
            } else if (fileData) {
                for (const repo in fileData) {
                    if (typeof fileData[repo] === 'string') {
                        defaultData.releases[repo] = { id: fileData[repo], name: 'Unknown', published_at: 'Unknown' };
                    }
                }
                releaseDoc.contents = releaseDoc.createNode(defaultData);
                
                Logger('[load] release.yml');
                return defaultData;
            }
        } catch (e) {
            Logger(`[error] release.yml : ${e.message}`, true);
        }
    }
    
    releaseDoc.contents = releaseDoc.createNode(defaultData);
    return defaultData;
};
let savedData = loadRelease();

const saveReleaseFile = () => {
    releaseDoc.contents = releaseDoc.createNode(savedData);
    const yamlString = YAML.stringify(releaseDoc, { 
        //collectionStyle: 'flow',
        collectionStyle: 'block',
        defaultStringType: 'QUOTE_DOUBLE',
        lineWidth: 0
    });
    fs.writeFileSync(RELEASE_FILE, yamlString, 'utf8');
    Logger('[save] release.yml');
};

//----------------------------------------------------------------release-old.txt
const OLD_RELEASE_LOG_FILE = './release-old.txt';
const logOldRelease = (repo, oldInfo, ) => {
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const logMessage = `[${now}] Repo: ${repo} | ID: ${oldInfo.id || 'N/A'} | Name: ${oldInfo.name || 'N/A'} | PublishedAt: ${oldInfo.published_at || 'N/A'} | body: ${oldInfo.body || 'N/A'}\n`;
    
    fs.appendFileSync(OLD_RELEASE_LOG_FILE, logMessage, 'utf8');
    Logger(`[save] release-old.txt : ${repo}`);
};

//----------------------------------------------------------------checkGitHubReleases
async function checkGitHubReleases(targetChannel = null) {
    REPOSITORIES = loadRepositories();
    savedData = loadRelease();
    let channel = targetChannel;
    
    if (!channel && savedData.target_channel_id) {
        channel = await client.channels.fetch(savedData.target_channel_id).catch((e) => writeLog(e.message, true));
    }

    if (!channel) {
        Logger('[error] channel not found', true);
        return null;
    }

    Logger('[start] checkRelease');
    let updatedCount = 0;

    for (const repo of REPOSITORIES) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
                headers: {
                    'Authorization': `token ${config['github-token']}`,
                    'User-Agent': 'Discord-Release-Bot'
                }
            });

            if (!response.ok) {
                if (response.status === 404) continue;
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const latestRelease = await response.json();
            const latestReleaseId = latestRelease.id.toString();

            const savedRepoInfo = savedData.releases[repo] || {};

            if (!savedRepoInfo.id || savedRepoInfo.id !== latestReleaseId) {
                
                if (savedRepoInfo.id) {
                    logOldRelease(repo, savedRepoInfo);
                }
                
                const escapedRepoName = escapeHtml(repo);
                const releaseName = latestRelease.name || latestRelease.tag_name;

                savedData.releases[escapedRepoName] = {
                    id: escapeHtml(latestReleaseId),
                    name: escapeHtml(releaseName),
                    published_at: escapeHtml(latestRelease.published_at),
                    body : escapeHtml(latestRelease.body)
                };

                saveReleaseFile();
                Logger(`[update] ${repo}`);
                updatedCount++;

                const embed = new EmbedBuilder()
                    .setTitle(`【${repo}】`)
                    .setURL(latestRelease.html_url)
                    .setDescription(`**バージョン:** ${latestRelease.tag_name}\n${latestRelease.body ? latestRelease.body.slice(0, 500) + '...' : '詳細な説明はありません。'}`)
                    .setColor('#24292e')
                    .setTimestamp(new Date(latestRelease.published_at));

                await channel.send({ embeds: [embed] });
            }

        } catch (error) {
            Logger(`[error] ${repo} : ${error.message}`, true);
        }
    }
    Logger('[complete] checkReleases');
    
    return { channel, count: updatedCount };
}


//----------------------------------------------------------------Ready
client.once(Events.ClientReady, () => {
    Logger(`[login] ${client.user.tag}`);

    cron.schedule('0 6,18 * * *', async () => {
        const result = await checkGitHubReleases();
        
        const currentHour = new Date(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })).getHours();
        
        if (currentHour === 6) {
            Logger('[complete] 6:00');
        } else if (currentHour === 18) {
            Logger('[complete] 18:00');
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

    if (message.content === '!c4460-here') {
        savedData.target_channel_id = message.channel.id;
        saveReleaseFile();
        await message.reply(`今後は#${message.channel.name}に情報を送信するね。`);
        return;
    }

    if (message.content.startsWith('!c4460-repository ')) {
        REPOSITORIES = loadRepositories();
        const targetRepo = message.content.slice('!c4460-repository '.length).trim();

        if (!targetRepo || !targetRepo.includes('/')) {
            await message.reply('リポジトリの指定方法が正しくないみたい。"所有者/リポジトリ名"の形式で入力してね。');
            return;
        }

        if (REPOSITORIES.includes(targetRepo)) {
            await message.reply(`"${targetRepo}"はすでに登録されているよ。`);
            return;
        }

        REPOSITORIES.push(targetRepo);
        repoDoc.add(targetRepo); 
        
        saveRepositoryFile();

        await message.reply(`"${targetRepo}"を新しく監視リストに追加したよ。`);
        return;
    }

    if (message.content === '!c4460-release') {
        const statusMessage = await message.reply('最新のリリースを確認中...');
        const result = await checkGitHubReleases(message.channel); 
        
        if (result && result.count === 0) {
            await statusMessage.edit('完了したよ。新しいリリースはなかったみたい。');
        } else {
            await statusMessage.edit('完了したよ。');
        }
    }
});

//----------------------------------------------------------------login
client.login(config['discord-token']);
