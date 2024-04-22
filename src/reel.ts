import { Application, Assets, Sprite, Text } from "pixi.js";
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"

const MAX_Y_POS = 660;
const Y_POS_GAP = 108; // 심볼 포지션 간격

// 릴 스핀 속도 관련
const MIN_SPEED = 0.07;
const MAX_SPEED = 0.02;
const EXPONENTIAL_SPEED_UP = 0.3;
const EXPONENTIAL_SPEED_DOWN = 1.1;

//
const WAIT_FOR_STOP_SIGN = -1;

class CSymbol {
    sprite: Sprite;
    idx: number;

    constructor(sprite_: Sprite, idx_: number) {
        this.sprite = sprite_;
        this.idx = idx_;
    }
}

export default class CReel {
    reelIdx: number;
    symbolArray: Array<CSymbol> = [];
    sequencePointer: number;
    isSpinning: boolean;
    speed!: number;
    speedController!: number;
    stopPointer: number;
    nextReel: CReel | null;
    isStopPermissionFromPrevReel!: boolean;
    isStopPermissionFromSelf!: boolean;
    stopSymbolIdxArray: Array<number> = [];
    stopCount!: number;
    
    constructor(reelIdx_: number) {
        this.reelIdx = reelIdx_;

        const symbolsPosOnReel: Array<{x: number, y: number}> = SYMBOL_MANAGER.defaultSymbolsPos[this.reelIdx];
        if(symbolsPosOnReel != null){
            for(let i = 0; i < symbolsPosOnReel.length; i++){
                const tempSymbolImg = new Sprite();

                tempSymbolImg.x = symbolsPosOnReel[i].x;
                tempSymbolImg.y = symbolsPosOnReel[i].y;

                const tempSymbol: CSymbol= new CSymbol(tempSymbolImg, i);
                this.symbolArray.push(tempSymbol);
            }
        }

        this.sequencePointer = this.symbolArray.length - 1;
        this.isSpinning = false;

        this.nextReel = null;
        this.defaultSetting();

        for(let i = 0; i < 4; i++) {
            this.stopSymbolIdxArray.push(i);
        }
        //1, 2, 3, 4 번이 화면에 보이는 슬롯

        this.stopCount = 0;
        this.stopPointer = WAIT_FOR_STOP_SIGN;
    }

    private defaultSetting() : void {
        this.speed = MIN_SPEED;
        this.speedController = EXPONENTIAL_SPEED_UP;

        this.isSpinning = false;

        if(this.reelIdx == 0) {
            this.isStopPermissionFromPrevReel = true;
            //this.speed = MIN_SPEED / 2;
        } else
        {
            this.isStopPermissionFromPrevReel = false;
        }
        this.isStopPermissionFromSelf = false;
    }

    public setReelImg() : void {
        for(let i = 0; i < this.symbolArray.length; i++){
            const symbol = this.symbolArray[i];
            symbol.sprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbol.sprite);
        }
    }

    public setNextReel(nextReel_: CReel) : void {
        this.nextReel = nextReel_;
    }

    public start() : void {
        this.isSpinning = true;
        this.stopCount = 0;
        this.stopPointer = WAIT_FOR_STOP_SIGN;
        this.spin();
    }

    private spin() : void {

        const clonedArray = [...this.symbolArray];
        for (const symbol of clonedArray) {
            this.moveSymbolTweenMax(symbol);
        }
    }

    private moveSymbolTweenMax(symbol_ : CSymbol) : void {
        const MOVE_GAP = 50;
        const DELAY = 0.04;
        // 스핀 스탑할 때 텅하는 효과, 재귀 종료

            // 재귀 호출로 이미지 이동 및 변경
        TweenMax.to(symbol_.sprite, this.speed, { y: symbol_.sprite.y + Y_POS_GAP, onComplete: () => {
            
            symbol_.idx++;
            if(symbol_.idx >= this.symbolArray.length) {
                symbol_.idx = 0;
            }

            if(this.isSpinning == false) {
                TweenMax.to(symbol_.sprite, this.speed, { y: 552 - Y_POS_GAP * (symbol_.idx) + MOVE_GAP, onComplete: () => {
                    if(symbol_.idx >= 1 && symbol_.idx <= 4) {
                        let symbolIdentity = SYMBOL_MANAGER.getSymbolIdxByTexture(symbol_.sprite.texture);
                        if(symbolIdentity != null) {
                            this.stopSymbolIdxArray[4 - symbol_.idx] = symbolIdentity;
                            this.stopCount++;
                        }
                    }
                    TweenMax.to(symbol_.sprite, DELAY, { y: symbol_.sprite.y - MOVE_GAP, delay: DELAY})
                }});
                return;
            }
            else {
                this.updateImg(symbol_);
                this.moveSymbolTweenMax(symbol_);
            }
        }})
        
    }

    private updateImg(target_ : CSymbol) {
        if(target_.sprite.y >= MAX_Y_POS){

            this.symbolArray = this.symbolArray.filter(item => item !== target_);
            const lastImgIdx = this.symbolArray.length - 1;

            // 제일 마지막 심볼 위 y값
            target_.sprite.y = this.symbolArray[lastImgIdx].sprite.y - Y_POS_GAP;

            this.sequencePointer++;
            if(this.sequencePointer >= SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
                this.sequencePointer = 0;
            }

            target_.sprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, this.sequencePointer)!;
            this.symbolArray.push(target_);
        }
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

    public getCheckPossibility() : boolean {
        if(this.stopCount == 4) {
            return true;
        }

        return false;
    }
}