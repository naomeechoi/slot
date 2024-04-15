import { Application, Assets, Sprite, Texture } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
const SYMBOL_COUNT = 8;
const LIMIT_Y_POSITION = 660;
const MIN_SPEED = 15;
const MAX_SPEED = 40;
const EXPONENTIAL_SPEED_UP = 1.2;
const EXPONENTIAL_SPEED_DOWN = 0.991;
const Y_GAP = 108;

export default class CReel {
    reelIdx: number;
    symbolSpriteArray: Array<Sprite>;
    sequencePointer: number;
    isSpinning: boolean;
    speed: number;
    speedController: number;
    stopPointer: number;
    nextReel: CReel | null;
    permissionFromPrevReel: boolean;
    permissionFromSelf: boolean;
    
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
        this.speed = MIN_SPEED;
        this.speedController = EXPONENTIAL_SPEED_UP;
        this.stopPointer = -1;
        this.nextReel = null;

        if(this.reelIdx == 0) {
            this.permissionFromPrevReel = true;
        }
        else
        {
            this.permissionFromPrevReel = false;
        }
        this.permissionFromSelf = false;
    }

    public setReelImg() {
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbolSprite);
        }
    }

    public setNextReel(nextReel_: CReel) {
        this.nextReel = nextReel_;
    }

    public start(){
        this.isSpinning = true;
        this.speedController = EXPONENTIAL_SPEED_UP;
        if(this.reelIdx == 0) {
            this.permissionFromPrevReel = true;
        }
        else
        {
            this.permissionFromPrevReel = false;
        }
        this.permissionFromSelf = false;
    }

    public readyToStop(stopIdx_: number){
       // this.isSpinning = false;
        this.stopPointer = stopIdx_;
        //this.speedController = EXPONENTIAL_SPEED_DOWN;
        // this.speed = DEFAULT_SPEED;
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

        this.speed *= this.speedController;
        if(this.speed >= MAX_SPEED){
            this.speed = MAX_SPEED;
        }
        else if(this.speed <= MIN_SPEED) {
            this.speed = MIN_SPEED;
        }
        /*
        if(this.speed <= MIN_SPEED){
            this.speed = MIN_SPEED;
        }
        */
        
        this.coolDownSpeed();

        if(this.permissionFromSelf) {
            if(this.stopPointer == this.sequencePointer) {
                this.isSpinning = false;
                this.stopPointer = -1;

                if(this.nextReel != null){
                    this.nextReel.permissionFromPrevReel = true;
                }
            }
        }
    }

    private coolDownSpeed(){
        //스탑 사인이 왔다.
        if(this.stopPointer == -1) {
            return;
        }

        // 다른 릴로부터 멈춰도 된다고 허락을 받았다.
        if(!this.permissionFromPrevReel) {
            return;
        }

        // 내 자신이 멈추라고 허락을 내리지 않은 상태여야 한다.
        if(this.permissionFromSelf) {
            return;
        }

        this.sequencePointer = this.stopPointer - 20;
        if(this.sequencePointer < 0) {
            this.sequencePointer += 90;
        }

        this.permissionFromSelf = true;
        this.speedController = EXPONENTIAL_SPEED_DOWN;
        return;
        
    }
}