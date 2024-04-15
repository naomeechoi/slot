import { Application, Assets, Sprite, Texture } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
const SYMBOL_COUNT = 8;
const LIMIT_Y_POSITION = 660;
const DEFAULT_SPEED = 20;
const EXPONENTIAL_SPEED_GROWTH = 1.015;
const Y_GAP = 108;

export default class CReel {
    reelIdx: number;
    symbolSpriteArray: Array<Sprite>;
    sequencePointer: number;
    isSpinning: boolean;
    speed: number;
    
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

        this.sequencePointer = SYMBOL_COUNT - 1;
        this.isSpinning = false;
        this.speed = DEFAULT_SPEED;
    }

    public setReelImg() {
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbolSprite);
        }
    }

    public setSpinningStatus(isSpinning_: boolean){
        this.isSpinning = isSpinning_;
        if(this.isSpinning == false){
            this.speed = DEFAULT_SPEED;
        }
    }

    public update(){
        if(this.isSpinning == false)
            return;

        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.y += this.speed;
        }

        if(this.symbolSpriteArray[0].y >= LIMIT_Y_POSITION){
            APP.stage.removeChild(this.symbolSpriteArray[0]);
            this.symbolSpriteArray.shift();

            // 새로운 심볼 이미지 뒤에 붙여줌
            const newSymbolImg = new Sprite();
            const lastImgIdx = this.symbolSpriteArray.length - 1;
            newSymbolImg.x = this.symbolSpriteArray[lastImgIdx].x;

            // 제일 마지막 심볼 위 y값
            newSymbolImg.y = this.symbolSpriteArray[lastImgIdx].y - Y_GAP;

            this.sequencePointer++;
            if(this.sequencePointer > SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
                this.sequencePointer = 0;
            }
            newSymbolImg.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, this.sequencePointer)!;
            this.symbolSpriteArray.push(newSymbolImg);
            APP.stage.addChild(newSymbolImg);
        }

        this.speed *= EXPONENTIAL_SPEED_GROWTH;
    }
}