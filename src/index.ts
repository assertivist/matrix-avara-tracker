import { AutojoinRoomsMixin, MatrixClient, SimpleRetryJoinStrategy } from "matrix-bot-sdk";
import config from "./config";
import { LogService } from "matrix-js-snippets";
import { LocalstorageStorageProvider } from "./LocalstorageStorageProvider";

LogService.configure(config.logging);
const storageProvider = new LocalstorageStorageProvider("./storage");
const client = new MatrixClient(config.homeserverUrl, config.accessToken, storageProvider);

async function run() {
    const userId = await client.getUserId();

    client.on("room.message", (roomId, event) => {
        if (event['sender'] === userId) return;
        if (!event['content']) return;
        if (event['type'] !== "m.room.message") return;
        if (event['content']['msgtype'] !== "m.text") return;
        if (event['content']['body'] !== ":(") return;

        client.sendNotice(roomId, ":)");
    });

    AutojoinRoomsMixin.setupOnClient(client);
    client.setJoinStrategy(new SimpleRetryJoinStrategy());
    return client.start();
}

run().then(() => LogService.info("index", "Smile bot started!"));
