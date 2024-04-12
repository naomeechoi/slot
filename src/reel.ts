import { Application, Assets, Sprite, Texture } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
const SYMBOL_COUNT = 8;
const LIMIT_Y_POSITION = 660;
const DEFAULT_Y_POSITION = -204;
const SPEED = 30;

export default class CReel {
    reelIdx: number;
    symbolSpriteArray: Array<Sprite>;
    lastSymbol: number;
    
    constructor(reelIdx_: number) {
        this.reelIdx = reelIdx_;
        this.symbolSpriteArray = new Array<Sprite>;

        const symbolsPosOnReel: {x: number, y: number}[] = SYMBOL_MANAGER.defaultSymbolsPos[this.reelIdx];
        if(symbolsPosOnReel != null){
            for(let i = 0; i < symbolsPosOnReel.length; i++){
                const tempSymbolImg = new Sprite();

                tempSymbolImg.x = symbolsPosOnReel[i].x;
                tempSymbolImg.y = symbolsPosOnReel[i].y;
                this.symbolSpriteArray.push(tempSymbolImg);
            }
        }

        this.lastSymbol = SYMBOL_COUNT - 1;
    }

    public setReelImg() {
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbolSprite);
        }
    }

    public update(){
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.y += SPEED;

            if(symbolSprite.y >= LIMIT_Y_POSITION){
                symbolSprite.y = DEFAULT_Y_POSITION;
                this.lastSymbol++;
                if(this.lastSymbol > SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
                    this.lastSymbol = 0;
                }
                symbolSprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, this.lastSymbol)!;
            }
        }
    }
}