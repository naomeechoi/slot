import { Application} from "pixi.js";
import { TweenMax } from 'gsap/TweenMax';
import CSymbolManager from "./symbolManager"
import CRewardManager from "./rewardManager"
import json from "./assets/data.json";

class CUtilities {
    ///////////////////////////////////////////////////////////////////////////
    // 돈 표시에 달러 사인, 콤마 추가 하기
    ///////////////////////////////////////////////////////////////////////////
    public static addDollarSignAndCommaToNumber(number_: number | string): string {
        if(typeof number_ == "string") {
            number_ = parseInt(number_);
        }

        // 콤마를 몇 개 찍어야 하는지 계산
        let commaCount: number = 0;
        let tempNum: number = number_;
        while(tempNum >= 1000) {
            commaCount++;
            tempNum /= 1000;
        }

        // 찍을 콤마 없다면 리턴
        if(commaCount == 0) {
            if(number_ > 0) {
                return number_.toString();
            }
            else {
                return "";
            }
        }

        // 콤마 추가
        let numberStr = number_.toString();
        let textParts: string[] = numberStr.split('').reverse();
        while(commaCount > 0) {
            textParts.splice(commaCount * 3, 0, ',');
            commaCount--;
        }
        
        // 달러 표시 달고 배열 합치기
        let result: string = "$";
        for(let i = textParts.length - 1; i >= 0; i--) {
            result += textParts[i];
        }
        
        return result;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 타임 아웃 제거
    ///////////////////////////////////////////////////////////////////////////
    public static clearTimeout(timeoutArray_: NodeJS.Timeout[]) {
        for(const timeoutEle of timeoutArray_) {
            if(timeoutEle != null) {
                clearTimeout(timeoutEle);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 트윈 킬
    ///////////////////////////////////////////////////////////////////////////
    public static killTweenMax(tweenArray_: TweenMax[]) {
        for(const tweenEle of tweenArray_) {
            if(tweenEle != null) {
                tweenEle.kill();
            }
        }
    }
}
export const UTIL = CUtilities;

class CSingleton {
    public static app: Application;
    public static symbolManager: CSymbolManager;
    public static rewardManager: CRewardManager;
}
CSingleton.app = new Application();
export const APP = CSingleton.app;

const DATA_STR = JSON.stringify(json);
const JSON_OBJECT = JSON.parse(DATA_STR);
CSingleton.symbolManager = CSymbolManager.getInstance(JSON_OBJECT["SymbolInfo"], JSON_OBJECT["Strip"], JSON_OBJECT["SymbolPosition"]);
CSingleton.rewardManager = CRewardManager.getInstance(JSON_OBJECT["PayLines"], JSON_OBJECT["TotalBet"]);

export const SYMBOL_MANAGER = CSingleton.symbolManager;
export const REWARD_MANAGER = CSingleton.rewardManager;

await SYMBOL_MANAGER.loadTextures(JSON_OBJECT["WildEffect"]);