import { Application} from "pixi.js";
import CSymbolManager from "./symbolManager"
import CRewardManager from "./rewardManager"
import json from "./assets/data.json";

class CSingleton {
    public static app: Application;
    public static symbolManager: CSymbolManager;
    public static rewardManager: CRewardManager;
    public static addDollarSignAndCommaToNumber(number_: number | string): string {

        if(typeof number_ == "string") {
            number_ = parseInt(number_);
        }

        let originalNumber: number = number_;
        let commaCount = 0;
        while(originalNumber > 1000) {
            commaCount++;
            originalNumber /= 1000;
        }

        if(commaCount == 0) {
            return "";
        }

        let originalNumberText = number_.toString();
        
        let textParts: string[] = originalNumberText.split('').reverse();
        while(commaCount > 0) {
            textParts.splice(commaCount * 3, 0, ',');
            commaCount--;
        }
        
        let result: string = "$";
        for(let i = textParts.length - 1; i >= 0; i--) {
            result += textParts[i];
        }
        
        return result;
    }
}
CSingleton.app = new Application();
export const APP = CSingleton.app;

const DATA_STR = JSON.stringify(json);
const JSON_OBJECT = JSON.parse(DATA_STR);
CSingleton.symbolManager = CSymbolManager.getInstance(JSON_OBJECT["SymbolInfo"], JSON_OBJECT["Strip"], JSON_OBJECT["SymbolPosition"]);
CSingleton.rewardManager = CRewardManager.getInstance(JSON_OBJECT["PayLines"]);

export const SYMBOL_MANAGER = CSingleton.symbolManager;
export const REWARD_MANAGER = CSingleton.rewardManager;
export const FANCY_TEXT = CSingleton.addDollarSignAndCommaToNumber;

await SYMBOL_MANAGER.loadTextures();