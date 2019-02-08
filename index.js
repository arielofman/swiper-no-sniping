const botSettings = require("./botSettings.json");

const { Client, Attachment, RichEmbed } = require('discord.js');
const client = new Client({disableEveryone: true});

const SNIPE_COUNTDOWN_CHANNEL = "541376144859987978";
const EAST_CODES = "542819123902545921";
const EAST_MATCHES = "543222104930123847";

let tc_codes, tc_matches;

let sentID = 0;

let matches = {};
let matchActive = false;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // find the channels
  tc_codes = client.channels.get(EAST_CODES);
  tc_matches = client.channels.get(EAST_MATCHES);
});

function addPlayer(game_code, mention) {
  let prevServer = 0;

  // delete player if they're already in another server
  for(let match in matches) {
    for(i = 0; i < matches[match].length; i++) {
      if(matches[match][i] === mention) {
        prevServer = match;
        matches[match].splice(i, 1);
      }
    }
  }

  if(matches[prevServer] === undefined || matches[prevServer].length == 0) {
    delete matches[prevServer];
  }

  if(!matches[game_code]) {
    matches[game_code] = [];
  }

  matches[game_code].push(mention);
}

client.on('message', msg => { 
  if(msg.channel.id === EAST_CODES && msg.content.length === 3) {
    if(matchActive) {
    let game_code = msg.content;

    let mention = `<@${msg.member.id}>`;

    addPlayer(game_code, mention);

    let buildJson = {embed: {
                color: 3447003,
                title: "Current servers:",
                fields: [],
                timestamp: new Date()
              }};

    let currPlayers = "";

    for(let match in matches) {
      for(let player of matches[match]) {
        currPlayers += (player + "\n");
      }
      buildJson.embed.fields.push({name: `ID: ${match} (${matches[match].length} total)`,
                                  value: currPlayers,
                                  inline: "true"});
      currPlayers = "";
    }

    if(sentID === 0) {
      tc_matches.send(buildJson).then(sent => {
        sentID = sent.id;
      });
    } else {
      tc_matches.fetchMessage(sentID)
      .then(msg => msg.edit(buildJson))
      .catch(console.error);
    }

  } else {
    tc_codes.send("No matches currently active!");
  }
}

  if (msg.content === '/notify') {
    // delete last messages
    msg.delete();

    tc_codes.send({embed: {
      color: 3066993,
      author: {
        name: client.user.username,
        icon_url: client.user.avatarURL
      },
      title: "`SNIPE MATCH STARTING`",
      fields: [
        {
          name: "Alert:",
          value: "- A snipe match is starting, pay attention!"
        },
        {
          name: "Instructions:",
          value: "- We will do a countdown from 3 sec and you will ready up on go."
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: client.user.avatarURL,
      }
    }
  });

  }
  if (msg.content === '/start') {
    // delete last messages
    msg.delete();

    // restart match
    matchActive = true;
    sentID = 0;
    matches = {};

    vc = client.channels.get(SNIPE_COUNTDOWN_CHANNEL);
    tc_codes = client.channels.get(EAST_CODES);

    vc.join().then(connection => { // Connection is an instance of VoiceConnection
      const dispatcher = connection.playFile('./321.mp3');
      dispatcher.on("end", end => {
        msg.member.voiceChannel.leave()

        tc_codes.send({embed: {
          color: 3066993,
          title: "Waiting for server IDs...",
          fields: [
            {
              name: "Please enter the last 3 digits of your server identifier.",
              value: "When in-game, you find this in the top left corner of your screen."
            }
          ],
          footer: {
            icon_url: client.user.avatarURL,
          }
        }
        });
      });
    }).catch(console.log);
  }

  if (msg.content === '/end') {
      // delete last messages
      msg.delete();

      // reset ID for editing
      sentID = 0;

      vc = client.channels.get(SNIPE_COUNTDOWN_CHANNEL);
      if (vc) {
        vc.leave();
      }
      matchActive = false;

      tc_matches.send({embed: {
        color: 15158332,
        title: "MATCH ENDED",
        description: "A host will announce when the next match will start.",
        footer: {
          icon_url: client.user.avatarURL,
        }
      }
    });
  }
});

client.login(botSettings.token);
