import { Application, Assets, Sprite, Texture } from "pixi.js";
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"

const SYMBOL_COUNT = 8;
const MAX_Y_POS = 660;
const Y_POS_GAP = 108; // 심볼 포지션 간격

// 릴 스핀 속도 관련
const MIN_SPEED = 0.07;
const MAX_SPEED = 0.02;
const EXPONENTIAL_SPEED_UP = 0.3;
const EXPONENTIAL_SPEED_DOWN = 1.1;

//
const WAIT_FOR_STOP_SIGN = -1;

export default class CReel {
    reelIdx: number;
    symbolSpriteArray: Array<Sprite>;
    sequencePointer: number;
    isSpinning: boolean;
    speed!: number;
    speedController!: number;
    stopPointer!: number;
    nextReel: CReel | null;
    isStopPermissionFromPrevReel!: boolean;
    isStopPermissionFromSelf!: boolean;
    
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

        this.nextReel = null;
        this.defaultSetting();
    }

    private defaultSetting() : void {
        this.speed = MIN_SPEED;
        this.speedController = EXPONENTIAL_SPEED_UP;

        this.isSpinning = false;
        this.stopPointer = WAIT_FOR_STOP_SIGN;

        if(this.reelIdx == 0) {
            this.isStopPermissionFromPrevReel = true;
            this.speed = MAX_SPEED;
        } else
        {
            this.isStopPermissionFromPrevReel = false;
        }
        this.isStopPermissionFromSelf = false;
    }

    public setReelImg() : void {
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            symbolSprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbolSprite);
        }
    }

    public setNextReel(nextReel_: CReel) : void {
        this.nextReel = nextReel_;
    }

    public start() : void {
        this.isSpinning = true;
        this.spin();
    }

    private spin() : void {
        for(let i = 0; i < this.symbolSpriteArray.length; i++){
            const symbolSprite = this.symbolSpriteArray[i];
            this.moveSymbolTweenMax(symbolSprite, i);
        }
    }

    private moveSymbolTweenMax(symbolSprite_ : Sprite, posOffset_: number) : void {
        TweenMax.to(symbolSprite_, this.speed, { y: MAX_Y_POS - Y_POS_GAP * posOffset_, onComplete: () => {

            if(this.isSpinning == false)
                return;

            posOffset_--;
            if(posOffset_ < 0) {
                posOffset_ = this.symbolSpriteArray.length - 1;
            } 
            this.moveSymbolTweenMax(this.updateImg(symbolSprite_), posOffset_);
        }})
    }

    private updateImg(target_ : Sprite) : Sprite {
        if(target_.y >= MAX_Y_POS){
            APP.stage.removeChild(target_);
            this.symbolSpriteArray.shift();

            // 새로운 심볼 이미지 뒤에 붙여줌
            const newSymbolImg = new Sprite();
            const lastImgIdx = this.symbolSpriteArray.length - 1;
            newSymbolImg.x = this.symbolSpriteArray[lastImgIdx].x;

            // 제일 마지막 심볼 위 y값
            newSymbolImg.y = this.symbolSpriteArray[lastImgIdx].y - Y_POS_GAP;

            this.sequencePointer++;
            if(this.sequencePointer > SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
                this.sequencePointer = 0;
            }
            newSymbolImg.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, this.sequencePointer)!;
            this.symbolSpriteArray.push(newSymbolImg);
            APP.stage.addChild(newSymbolImg);

            return newSymbolImg;
        }
        return target_;
    }

    public readyToStop(stopPointer_: number) : void {
        this.stopPointer = stopPointer_;
    }

    public update() : void {
        if(this.isSpinning == false)
            return;

        this.controlSpinSpeed();
        this.prepareToStop();
        this.stop();
    }

    private controlSpinSpeed() : void {
        this.speed *= this.speedController;
        if(this.speed < MAX_SPEED) {
            this.speed = MAX_SPEED;
        } else if(this.speed > MIN_SPEED) {
            this.speed = MIN_SPEED;
        }
    }

    private prepareToStop() : void {
        //스탑 사인이 왔다.
        if(this.stopPointer == WAIT_FOR_STOP_SIGN) {
            return;
        }

        // 다른 릴로부터 멈춰도 된다고 허락을 받았다.
        if(!this.isStopPermissionFromPrevReel) {
            return;
        }

        // 내 자신이 멈추라고 허락을 내리지 않은 상태여야 한다.
        if(this.isStopPermissionFromSelf) {
            return;
        }

        const DISTANCE_FROM_STOP_POINTER = 20;
        this.sequencePointer = this.stopPointer - DISTANCE_FROM_STOP_POINTER;

        const OUT_OF_BOUNDARY = -1;
        if(this.sequencePointer <= OUT_OF_BOUNDARY) {
            this.sequencePointer += SYMBOL_MANAGER.getSequenceLength(this.reelIdx);
        }

        this.isStopPermissionFromSelf = true;
        this.speedController = EXPONENTIAL_SPEED_DOWN;
        return;
    }

    private stop() : void {
        if(this.isStopPermissionFromSelf) {
            if(this.stopPointer == this.sequencePointer) {
                if(this.nextReel != null){
                    this.nextReel.isStopPermissionFromPrevReel = true;
                }
                this.defaultSetting();
            }
        }
    }
}