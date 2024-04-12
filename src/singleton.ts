import { Application} from "pixi.js";
import CSymbolManager from "./symbolManager"
import CRewardManager from "./rewardManager"
import json from "./assets/data.json";

class CSingleton {
    public static app: Application;
    public static symbolManager: CSymbolManager;
    public static rewardManager: CRewardManager;
}
CSingleton.app = new Application();
export const APP = CSingleton.app;

const DATA_STR = JSON.stringify(json);
const JSON_OBJECT = JSON.parse(DATA_STR);
CSingleton.symbolManager = new CSymbolManager(JSON_OBJECT["SymbolInfo"], JSON_OBJECT["Strip"], JSON_OBJECT["SymbolPosition"]);
CSingleton.rewardManager = new CRewardManager(JSON_OBJECT["PayLines"]);

export const SYMBOL_MANAGER = CSingleton.symbolManager;
export const REWARD_MANAGER = CSingleton.rewardManager;

await SYMBOL_MANAGER.loadTextures();