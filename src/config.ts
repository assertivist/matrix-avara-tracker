import * as config from "config";
import { LogConfig } from "matrix-js-snippets";

interface IConfig {
    homeserverUrl: string;
    accessToken: string;
    dataPath: string;
    logging: LogConfig;
}

export default <IConfig>config;