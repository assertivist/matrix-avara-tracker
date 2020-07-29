import {
    AutojoinRoomsMixin,
    AutojoinUpgradedRoomsMixin,
    MatrixClient,
    SimpleFsStorageProvider,
    SimpleRetryJoinStrategy
} from "matrix-bot-sdk";
import config from "./config";
import * as mkdirp from "mkdirp";
import { LogService } from "matrix-js-snippets";
import * as path from "path";
const got = require('got');
const noodlejs = require("noodle.js");

mkdirp.sync(config.dataPath);

LogService.configure(config.logging);
const storageProvider = new SimpleFsStorageProvider(path.join(config.dataPath, "__matrix.db"));
const client = new MatrixClient(config.homeserverUrl, config.accessToken, storageProvider);

const trackerurl = "http://avara.io/";
const endpoint = "api/v1/games/";

/*
{
  "games": [
    {
      "address": "73.83.90.254",
      "port": 19567,
      "first_seen": "2020-07-25T07:28:23.527359+00:00",
      "last_seen": "2020-07-25T07:43:23.394011+00:00",
      "players": [
        "croc"
      ],
      "description": "esports aaaa",
      "password": false
    }
  ]
}
*/

function game_to_message(game) {
    var host = game["players"][0];
    var addr = game["address"];
    var desc = game["description"];
    var mins = ((Date.now() - Date.parse(game["first_seen"])) / (1000 * 60)).toFixed(1);
    var players = "";
    if (game["players"].length > 1) {
        players = " " + game["players"].join(", ") + " are playing";
    }
    return host + " is hosting '" + desc + "' at " + addr + " (up for " + mins + " mins)" + players;
}

var last_checked = Date.now();

var games = {};


async function run() {
    const userId = await client.getUserId();

    client.on("room.message", async (roomId, event) => {
        if (event['sender'] === userId) return;
        if (!event['content']) return;
        if (event['type'] !== "m.room.message") return;
        if (event['content']['msgtype'] !== "m.text") return;

        if (Date.now() - last_checked > 10000) {
            LogService.info("index", "checking tracker");
            last_checked = Date.now();
            await got(trackerurl + endpoint).then(response => {
                var results = JSON.parse(response.body)["games"];
                if (results.count < 1) {
                    games = {}
                }
                var new_hashes = [];
                for (let r of results) {
                    if (r["players"].length < 1) continue;
                    var game_hash = r["address"] + r["players"][0] + r["first_seen"];
                    new_hashes.push(game_hash);
                    if (games.hasOwnProperty(game_hash)) {
                        // we know about this game
                        // check the users against what we have
                        var known_users = games[game_hash]["players"];
                        var result_users = r["players"];
                        let left = known_users.filter(item => result_users.indexOf(item));
                        let joined = result_users.filter(item => known_users.indexOf(item));

                        if (left.length > 0 || joined.length > 0) {
                            games[game_hash]["update"] = known_users[0] + " is still hosting."
                            if (left.length > 0) { games[game_hash]["update"] += left.join(", ") + " left. " }
                            if (joined.length > 0) { games[game_hash]["update"] += joined.join(", ") + " joined. "}
                            games[game_hash]["players"] = r["players"];
                        }
                    }
                    else {
                        r["new"] = true;
                        r["update"] = "";
                        games[game_hash] = r;
                    }
                }
                var remove = [];
                for (var g in games) {
                    if(new_hashes.indexOf(g) < 0) {
                        remove.push(g);
                    }
                }
                for (let rm of remove) {
                    delete games[rm];
                }

            }).catch(error => { LogService.info("index", error) });
        }
        var msg = "";
        for (var g in games) {
            if (games[g]["new"] == true) {
                games[g]["new"] = false;
                msg += game_to_message(games[g]) + "\n";
            }
            if (games[g]["update"].length > 0) {
                //msg += games[g]["update"] + "\n";
                games[g]["update"] = "";
            }
        }
        if (msg.length > 0) {
            //msg += "\n" + trackerurl;
            return client.sendNotice(roomId, msg);
        }

    
        if (event['content']['body'].startsWith("!tracker")) {
            if (Object.keys(games).length < 1) return client.sendNotice(roomId, "No games");
            msg = "";
            for (g in games) {
                msg += game_to_message(games[g]) + "\n";
            }
            msg += trackerurl;
            return client.sendNotice(roomId, msg);
        }

        if (event['content']['body'].endsWith(":D")) {
            return client.sendNotice(roomId, "D:");
        } else if (event['content']['body'].endsWith(">:€")) {
            return client.sendNotice(roomId, "€:<");
        } else if (event['content']['body'].endsWith("u_u")) {
            return client.sendNotice(roomId, "n‾n");
        } else if (event['content']['body'].endsWith("D:")) {
            return client.sendNotice(roomId, ":D");
        }
    });

    AutojoinRoomsMixin.setupOnClient(client);
    AutojoinUpgradedRoomsMixin.setupOnClient(client);
    client.setJoinStrategy(new SimpleRetryJoinStrategy());
    return client.start();
}

run().then(() => LogService.info("index", "Tracker bot started!"));
