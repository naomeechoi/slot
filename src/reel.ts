import { Sprite } from "pixi.js";
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER } from "./singleton"

const Y_POS_GAP = 108; // 심볼 포지션 간격

// 릴 스핀 속도 관련
const MIN_SPINNING_SPEED = 0.07;
const MAX_SPINNING_SPEED = 0.02;
const EXPONENTIAL_UP = 0.3;
const EXPONENTIAL_DOWN = 1.1;

const WAIT_FOR_STOP_SIGN = -1;
const FIRST_REEL_DOES_NOT_NEED_PERMISSION = 0;

const SYMBOLS_ON_SCREEN_LENGTH = 4;

class CSymbol {
    sprite: Sprite;
    originalIdx: number;

    constructor(sprite_: Sprite, idx_: number) {
        this.sprite = sprite_;
        this.originalIdx = idx_;
    }
}

export default class CReel {
    reelIdx: number;
    bSpinning: boolean = false;

    symbolPool: CSymbol[] = [];
    sequenceLocation: number;

    spinningSpeed: number = MIN_SPINNING_SPEED;
    spinningSpeedController: number = EXPONENTIAL_UP;

    reelStopLocation: number = WAIT_FOR_STOP_SIGN;
    nextAdjacentReel: CReel | null = null;

    bPrevReelPermission: boolean = false;
    bSelfPermission: boolean = false;

    symbolsOnScreenMap: Map<number, number> = new Map;
    
    constructor(reelIdx_: number) {
        this.reelIdx = reelIdx_;

        const symbolsPosOnReel: Array<{x: number, y: number}> = SYMBOL_MANAGER.defaultSymbolsPos[this.reelIdx];
        if(symbolsPosOnReel != null){
            for(let i = 0; i < symbolsPosOnReel.length; i++){
                const tempSymbolImg = new Sprite();

                tempSymbolImg.x = symbolsPosOnReel[i].x;
                tempSymbolImg.y = symbolsPosOnReel[i].y;

                const tempSymbol: CSymbol= new CSymbol(tempSymbolImg, i);
                this.symbolPool.push(tempSymbol);
            }
        }
        this.sequenceLocation = this.symbolPool.length - 1;

        if(this.reelIdx == FIRST_REEL_DOES_NOT_NEED_PERMISSION) {
            this.bPrevReelPermission = true;
        } else
        {
            this.bPrevReelPermission = false;
        }
    }

    private reset() : void {
        this.spinningSpeed = MIN_SPINNING_SPEED;
        this.spinningSpeedController = EXPONENTIAL_UP;

        this.reelStopLocation = WAIT_FOR_STOP_SIGN;

        if(this.reelIdx == FIRST_REEL_DOES_NOT_NEED_PERMISSION) {
            this.bPrevReelPermission = true;
        } else
        {
            this.bPrevReelPermission = false;
        }
        this.bSelfPermission = false;

        this.symbolsOnScreenMap.clear();
    }

    public setReelImg() : void {
        for(let i = 0; i < this.symbolPool.length; i++){
            const symbol = this.symbolPool[i];
            symbol.sprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, i)!;
            APP.stage.addChild(symbol.sprite);
        }
    }

    public setNextReel(nextReel_: CReel) : void {
        this.nextAdjacentReel = nextReel_;
    }

    public start() : void {
        this.bSpinning = true;
        this.reset();
        this.spin();
    }

    private spin() : void {

        const clonedArray = [...this.symbolPool];
        for (const symbol of clonedArray) {
            this.moveSymbolTweenMax(symbol);
        }
    }

    private isSymbolOnScreen(idxOnArray: number): boolean {
        const SYMBOL_ON_SCREEN_START_IDX = 1;
        const SYMBOL_ON_SCREEN_LAST_IDX  = SYMBOL_ON_SCREEN_START_IDX + SYMBOLS_ON_SCREEN_LENGTH - 1;
        if(idxOnArray >= SYMBOL_ON_SCREEN_START_IDX && idxOnArray <= SYMBOL_ON_SCREEN_LAST_IDX) {
            return true;
        }

        return false;
    }

    private moveSymbolTweenMax(symbol_ : CSymbol) : void {
        const MOVE_GAP = 50;
        const DELAY = 0.04;
        const MAX_Y_POS = 552;
        // 스핀 스탑할 때 텅하는 효과, 재귀 종료

            // 재귀 호출로 이미지 이동 및 변경
        TweenMax.to(symbol_.sprite, this.spinningSpeed, { y: symbol_.sprite.y + Y_POS_GAP, onComplete: () => {
            
            symbol_.originalIdx++;
            if(symbol_.originalIdx >= this.symbolPool.length) {
                symbol_.originalIdx = 0;
            }

            if(this.bSpinning == false) {
                TweenMax.to(symbol_.sprite, this.spinningSpeed, { y: MAX_Y_POS - Y_POS_GAP * (symbol_.originalIdx) + MOVE_GAP, onComplete: () => {

                    if(this.isSymbolOnScreen(symbol_.originalIdx)) {
                        let symbolIdentityIdx = SYMBOL_MANAGER.getSymbolIdxByTexture(symbol_.sprite.texture);
                        if(symbolIdentityIdx != null) {
                            this.symbolsOnScreenMap.set(SYMBOLS_ON_SCREEN_LENGTH - symbol_.originalIdx, symbolIdentityIdx);
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
        const Y_POS_OUT_OF_BOUNDARY = 660;
        if(target_.sprite.y >= Y_POS_OUT_OF_BOUNDARY){

            this.symbolPool = this.symbolPool.filter(item => item !== target_);
            const lastImgIdx = this.symbolPool.length - 1;

            // 제일 마지막 심볼 위 y값
            target_.sprite.y = this.symbolPool[lastImgIdx].sprite.y - Y_POS_GAP;

            this.sequenceLocation++;
            if(this.sequenceLocation >= SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
                this.sequenceLocation = 0;
            }

            target_.sprite.texture = SYMBOL_MANAGER.getSymbolTextureOnSequence(this.reelIdx, this.sequenceLocation)!;
            this.symbolPool.push(target_);
        }
    }

    public readyToStop(stopPointer_: number) : void {
        this.reelStopLocation = stopPointer_;
    }

    public update() : void {
        if(this.bSpinning == false)
            return;

        this.controlSpinningSpeed();
        this.prepareToStop();
        this.stop();
    }

    private controlSpinningSpeed() : void {
        this.spinningSpeed *= this.spinningSpeedController;
        if(this.spinningSpeed < MAX_SPINNING_SPEED) {
            this.spinningSpeed = MAX_SPINNING_SPEED;
        } else if(this.spinningSpeed > MIN_SPINNING_SPEED) {
            this.spinningSpeed = MIN_SPINNING_SPEED;
        }
    }

    private prepareToStop() : void {
        //스탑 사인이 왔다.
        if(this.reelStopLocation == WAIT_FOR_STOP_SIGN) {
            return;
        }

        // 다른 릴로부터 멈춰도 된다고 허락을 받았다.
        if(!this.bPrevReelPermission) {
            return;
        }

        // 내 자신이 멈추라고 허락을 내리지 않은 상태여야 한다.
        if(this.bSelfPermission) {
            return;
        }

        const DISTANCE_FROM_STOP_POINTER = 20;
        this.sequenceLocation = this.reelStopLocation - DISTANCE_FROM_STOP_POINTER;

        const OUT_OF_BOUNDARY = -1;
        if(this.sequenceLocation <= OUT_OF_BOUNDARY) {
            this.sequenceLocation += SYMBOL_MANAGER.getSequenceLength(this.reelIdx);
        }

        this.bSelfPermission = true;
        this.spinningSpeedController = EXPONENTIAL_DOWN;
        return;
    }

    private stop() : void {
        if(this.bSelfPermission) {
            if(this.reelStopLocation == this.sequenceLocation) {
                if(this.nextAdjacentReel != null){
                    this.nextAdjacentReel.bPrevReelPermission = true;
                }
                //this.defaultSetting();
                this.bSpinning = false;
            }
        }
    }

    public getCheckPossibility() : boolean {
        if(this.symbolsOnScreenMap.size == 4) {
            return true;
        }

        return false;
    }
}