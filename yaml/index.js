const YAML = require('yaml');
const fs = require('fs');

const CONFIG_FILE = './config.yml';
const doc1 = YAML.parseDocument(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
const doc2 = YAML.parseDocument(`
"releases":
  "importster/TheOtherFunctions":
    "id": "172614100"
    "updated_at": "2024-10-03T05:45:50Z"
  "importster/importster-discord-bot":
    "id": "347964819"
    "updated_at": "2026-07-02T10:21:51Z"
`)
const repodog = YAML.parseDocument(`
repository:
  - importster/importster-discord-bot
  - "importster/TheOtherFunctions"
`)
const releasedog = YAML.parseDocument(`
"releases":
  "importster/TheOtherFunctions":
    "id": "172614100"
    "updated_at": "2024-10-03T05:45:50Z"
  "importster/importster-discord-bot":
    "id": "347964819"
    "updated_at": "2026-07-02T10:21:51Z"
`).contents.toJSON()
const config = YAML.parseDocument(`
"target_channel_id": "1521874479012253837"
"mention_users":
  - "1192480507167002737"
  - "1192480507167002731"
  - "1192480507167002732"
`).contents
//console.log(config)

//console.log(config.toJSON().target_channel_id);
//for (const repo of repodog.contents.get('repository').toJSON()) {
//  console.log(repo);
//}
//console.log(releasedog.releases[`importster/TheOtherFunctions`]);
//releasedog.releases[`aaaaa`] = {
//  id: 11111,
//  updated_at: 22222
//};



//console.log(releasedog.releases[`aaaaa`]);
//const doc = doc2.contents;
//console.log(String(doc));
//config.set('target_channel_id',`aaa`);
console.log(config.toJSON().target_channel_id)

//const releaserelease = doc.get("releases");
//doc.get("releases").set(new YAML.Scalar('importster/TheOtherFunctions1'))
//doc.get("releases").setIn(["importster/TheOtherFunctions1"],new YAML.YAMLMap())
//doc.get("releases").get("importster/TheOtherFunctions1").setIn([new YAML.Scalar("id")],new YAML.Scalar("1123"))
//doc.get("releases").setIn(["importster/TheOtherFunctions1"], {"id":"aaa","updated":"bbb"})

//console.log(JSON.stringify(doc.get("releases").get("importster/TheOtherFunctions")))

//console.log(doc.get("releases").get("importster/TheOtherFunctions").toJSON())
//console.log(doc.get("releases").get("importster/TheOtherFunctions1"))
//console.log(doc.get("releases").get("importster/TheOtherFunctions").toJSON())
//console.log(doc.get("releases").get("importster/TheOtherFunctions").toJSON().id)
/*
const doc7 = YAML.parseDocument(`
"releases":
  "importster/TheOtherFunctions":
    "id": "172614100"
    "updated_at": "2024-10-03T05:45:50Z"
  "importster/importster-discord-bot":
    "id": "347964819"
    "updated_at": "2026-07-02T10:21:51Z"
`).contents.toJSON()*/
//console.log(doc7.releases[`importster/TheOtherFunctions`])
//console.log(doc7.releases[`importster/TheOtherFunctions`].id)

/*const moveRepositoryCommennt = () => {
      YAML.visit(doc, {
        Pair(_, pair) {
            if(pair.value.comment){
                const comment1 = pair.value.comment;
                pair.value.comment = null;
                doc.addIn(["rmrepo"], `${comment1}`);
            }
            if(pair.commentBefore){
                const comment1 = pair.value.commentBefore;
                pair.value.commentBefore = null;
                doc.addIn(["rmrepo"], `${comment1}`);
            }
        }
      })
    YAML.visit(doc.get('repository'), {
        Scalar(key, node) {
            if(node.comment){
                const comment1 = node.comment;
                node.comment = null;
                doc.addIn(["rmrepo"], `${comment1}`);
            }
            if(node.commentBefore){
                const comment1 = node.commentBefore;
                node.commentBefore = null;
                doc.addIn(["rmrepo"], `${comment1}`);
            }
        }
    })
}*/
//doc.add({ key: 'mention_users3', value: [4] });

//const obs = doc.getIn([2, 'including'], true)
//obs.type = 'QUOTE_DOUBLE'
//doc.addIn(["mention_users"], 5)

//doc.get('repository').comment = doc.get('repository').comment +' aaa\r\n aaa'
//console.log(doc.toString());
//console.log(String(doc.get('mention_users3')));
//console.log(String(doc.items[1]));
//console.log(String(Object.values(doc.get('mention_users').items)))


//const mentions = Object.values(config.get('mention_users').items).map(id => `<@${id}>`).join(' ');
//config.get('target_channel_id').value = '1111111111112';
//console.log(config.get('target_channel_id'));
//console.log(doc.get('repository').toJSON().includes("importster/importster-discord-bot"));
//doc.get('repository').delete("importster/TheOtherFunctions1")
//console.log(String(doc));
//console.log(String(doc.contents));
/*YAML.visit(doc, {
  Pair(_, pair) {
    //console.log(pair.key.value);
    //console.log(String(pair.key.value));
    if (pair.key && pair.key.value === 'mention_users2') return YAML.visit.REMOVE

  },
  Scalar(key, node) {
    //console.log(node + "----");
    if(node.value === 'mention_users') return YAML.visit.REMOVE
    
    //if(node.value === '1192480507167002737') return YAML.visit.REMOVE
    /*if (
      key !== 'key' &&
      typeof node.value === 'string' &&
      node.type === 'PLAIN'
    ) {
      node.type = 'QUOTE_SINGLE'
    }*/
  //}
  //node(node, items) {
  //  if(items.value === '1192480507167002737') return YAML.visit.REMOVE
  //  
  //}
//})
//console.log(String(doc));

//moveRepositoryCommennt()
//const doc10 = YAML.parse(String(doc), { defaultStringType: 'PLAIN',defaultKeyType: 'PLAIN'})
//console.log(doc.get('rmrepo'))
const saveRepositoryFile = () => {
    const yamlString = YAML.stringify(config, { 
        collectionStyle: 'block',
        defaultStringType: 'PLAIN',
        defaultKeyType: 'PLAIN'
    });
    fs.writeFileSync("./config.yml", yamlString, 'utf8');
};
saveRepositoryFile()
//console.log(doc1)
//console.log(doc.get('repository'))
/*
const doc1 = YAML.parseDocument(`
{
    "文字列": "文字列", # コメント
    "数値": 0,
    "真偽値": true,
    "null値": null,
    "配列": [
        "要素1",
        "要素2"
    ],
    "オブジェクト": {
        "キー": "値"
    }
}

`)
*/
//saveConfigFile();
/*
const doc = new YAML.Document({ a: 1, b: [2, 3] }) // { a: 1, b: [ 2, 3 ] }
doc.add({ key: 'c', value: 4 }) // { a: 1, b: [ 2, 3 ], c: 4 }
doc.addIn(['b'], 5)             // { a: 1, b: [ 2, 3, 5 ], c: 4 }

doc.set('c', 42)                // { a: 1, b: [ 2, 3, 5 ], c: 42 }
//doc.setIn(['c', 'x']) // Error: Expected YAML collection at c. Remaining path: x
doc.delete('c')                 // { a: 1, b: [ 2, 3, 5 ] }
doc.deleteIn(['b', 1])          // { a: 1, b: [ 2, 5 ] }

doc.get('a').comment = ' A commented item'

console.log(String(doc));
console.log(doc.toString());
//console.log("-----------");
//console.log(YAML.stringify(doc));

doc.get('a') // 1
//console.log(doc.get('a'));
//console.log(doc.get('b'));

doc.get('a', true) // Scalar { value: 1 }
//console.log(doc.get('a', true));

doc.getIn(['b', 1]) // 5
//console.log(doc.getIn(['b', 1]));

doc.has(doc.createNode('a')) // true
doc.has('c') // false
doc.hasIn(['b', '0']) // true
*/