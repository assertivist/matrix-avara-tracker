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

mkdirp.sync(config.dataPath);

LogService.configure(config.logging);
const storageProvider = new SimpleFsStorageProvider(path.join(config.dataPath, "__matrix.db"));
const client = new MatrixClient(config.homeserverUrl, config.accessToken, storageProvider);

const trackerurl = "http://avara.io/";

var last_checked = Date.now();
var checking = false;

var games = [];


async function run() {
    const userId = await client.getUserId();

    client.on("room.message", (roomId, event) => {
        if (event['sender'] === userId) return;
        if (!event['content']) return;
        if (event['type'] !== "m.room.message") return;
        if (event['content']['msgtype'] !== "m.text") return;

	LogService.info("index", "Hello");
	LogService.info("index", Date.now());
	LogService.info("index", last_checked);
	LogService.info("index", checking);

	if (!checking && Date.now() - last_checked > 10000) {
	    LogService.info("index", "checking tracker");
	    checking = true;
            last_checked = Date.now();
	    got(trackerurl + "api/v1/games/").then(response => {
                games = JSON.parse(response.body)["games"];
		LogService.info("index", JSON.stringify(games));
		checking = false;
	    }).catch(error => { LogService.info("index", error) });
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

	if (event['content']['body'].startsWith("!tracker")) {
	    if (games.length < 1) return client.sendNotice(roomId, "No games");
	    return client.sendNotice(roomId, JSON.stringify(games));
	}
    });

    client.on("room.message", (e) => {
	}
    });

    AutojoinRoomsMixin.setupOnClient(client);
    AutojoinUpgradedRoomsMixin.setupOnClient(client);
    client.setJoinStrategy(new SimpleRetryJoinStrategy());
    return client.start();
}

run().then(() => LogService.info("index", "Smile bot started!"));
