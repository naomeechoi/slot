import { Sprite } from "pixi.js";
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER, UTIL } from "./singleton"

const Y_POS_GAP = 108;
const WAIT_FOR_STOP_SIGN = -1;
const FIRST_REEL_DOES_NOT_NEED_PERMISSION = 0;
const SYMBOLS_ON_SCREEN_LENGTH = 4;

// 릴 스핀 속도 관련
const MIN_SPINNING_SPEED = 0.07;
const MAX_SPINNING_SPEED = 0.02;
const EXPONENTIAL_UP = 0.3;
const EXPONENTIAL_DOWN = 1.1;

///////////////////////////////////////////////////////////////////////////////
class CSymbol {
    sprite: Sprite;
    originalIdx: number;

    constructor(sprite_: Sprite, idx_: number) {
        this.sprite = sprite_;
        this.originalIdx = idx_;
    }
}

///////////////////////////////////////////////////////////////////////////////
export default class CReel {
    private reelIdx: number;
    private bSpinning: boolean = false;
    private symbolPool: CSymbol[] = [];
    private sequenceLocation: number;
    private spinningSpeed: number = MIN_SPINNING_SPEED;
    private spinningSpeedController: number = EXPONENTIAL_UP;
    private reelStopLocation: number = WAIT_FOR_STOP_SIGN;
    private nextAdjacentReel: CReel | null = null;
    private bPrevReelPermission: boolean = false;
    private bSelfPermission: boolean = false;
    private symbolsOnScreenMap: Map<number, Sprite> = new Map;
    private tweenMaxArray: TweenMax[] = [];
    
    constructor(reelIdx_: number) {
        this.reelIdx = reelIdx_;

        if(SYMBOL_MANAGER.getDefaultSymbolsPos()[this.reelIdx] == null) {
            // TODO
            // 실행 되면 안 됌
        }

        // 심볼들의 초기 스크린상 위치를 받아서 셋팅해준다.
        const symbolsPosOnReel: {x: number, y: number}[] = SYMBOL_MANAGER.getDefaultSymbolsPos()[this.reelIdx];
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

    ///////////////////////////////////////////////////////////////////////////
    // 한 게임이 끝나고 초기화되어야 할 정보들이다.
    ///////////////////////////////////////////////////////////////////////////
    private reset(): void {
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
        UTIL.killTweenMax(this.tweenMaxArray);
    }

    ///////////////////////////////////////////////////////////////////////////
    // CSlot에서 심볼들의 texture를 셋팅해준다.
    ///////////////////////////////////////////////////////////////////////////
    public setSymbolsTexture(): void {
        for(let i = 0; i < this.symbolPool.length; i++){
            const symbol = this.symbolPool[i];
            const tempTexture = SYMBOL_MANAGER.getSymbolTextureBySequenceLocation(this.reelIdx, i);
            if(tempTexture != null) {
                symbol.sprite.texture = tempTexture;
                APP.stage.addChild(symbol.sprite);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // CSlot에서 다음에 오는 릴을 셋팅해준다.
    ///////////////////////////////////////////////////////////////////////////
    public setNextAdjacentReel(nextReel_: CReel): void {
        this.nextAdjacentReel = nextReel_;
    }

    ///////////////////////////////////////////////////////////////////////////
    // CSlot에서 불리는 시작 함수
    ///////////////////////////////////////////////////////////////////////////
    public start(): void {
        this.bSpinning = true;
        this.reset();
        this.startSpinning();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼을 움직이기 시작한다.
    ///////////////////////////////////////////////////////////////////////////
    private startSpinning(): void {
        const clonedSymbolPool = [...this.symbolPool];
        for (const symbol of clonedSymbolPool) {
            this.moveSymbolByTweenMaxRecursion(symbol);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 화면에서 보이는 심볼인지 판단한다.
    ///////////////////////////////////////////////////////////////////////////
    private isSymbolOnScreen(idx_: number): boolean {
        const SYMBOL_ON_SCREEN_START_IDX = 1;
        const SYMBOL_ON_SCREEN_LAST_IDX  = SYMBOL_ON_SCREEN_START_IDX + SYMBOLS_ON_SCREEN_LENGTH - 1;

        if(idx_ >= SYMBOL_ON_SCREEN_START_IDX && idx_ <= SYMBOL_ON_SCREEN_LAST_IDX) {
            return true;
        }
        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 트윈맥스, 재귀를 이용해 심볼을 움직인다.
    ///////////////////////////////////////////////////////////////////////////
    private moveSymbolByTweenMaxRecursion(symbol_: CSymbol): void {
        const THUD_VISUAL_EFFECT = 50;
        const THUD_EFFECT_DELAY = 0.015;
        const MAX_Y_POS = 552;
        // 스핀 스탑할 때 텅하는 효과, 재귀 종료

            // 재귀 호출로 이미지 이동 및 변경
        const recursiveTween = TweenMax.to(symbol_.sprite, this.spinningSpeed, { ease: "none", y: symbol_.sprite.y + Y_POS_GAP, onComplete: () => {
            
            symbol_.originalIdx++;
            if(symbol_.originalIdx >= this.symbolPool.length) {
                symbol_.originalIdx = 0;
            }

            if(this.bSpinning == false) {
                // 쿵하는 효과를 주기 위해 조금 더 아래로 내린다.
                const readyToStopTween = TweenMax.to(symbol_.sprite, this.spinningSpeed, { ease: "none", y: MAX_Y_POS - Y_POS_GAP * (symbol_.originalIdx) + THUD_VISUAL_EFFECT, onComplete: () => {
                    // 다시 제자리로 올라온다.
                    const stopTween = TweenMax.to(symbol_.sprite, MAX_SPINNING_SPEED, { ease: "none", y: symbol_.sprite.y - THUD_VISUAL_EFFECT, delay: THUD_EFFECT_DELAY, onComplete: () => {
                        // 스크린에 보여줘야할 심볼이면 symbolsOnScreenMap에 담아둔다.
                        // symbolsOnScreenMap은 페이라인을 판단하는데 쓰인다.
                        if(this.isSymbolOnScreen(symbol_.originalIdx)) {
                            this.symbolsOnScreenMap.set(SYMBOLS_ON_SCREEN_LENGTH - symbol_.originalIdx, symbol_.sprite);
                        }
                    }})

                    this.tweenMaxArray.push(stopTween);
                }});
                this.tweenMaxArray.push(readyToStopTween);
                return;
            }
            else {
                // 스핀하는 중이면 텍스쳐와 심볼풀을 업데이트 시키고 재귀를 통해 심볼을 움직인다.
                this.changeTextureAndRelocate(symbol_);
                this.moveSymbolByTweenMaxRecursion(symbol_);
            }
        }})
        
        this.tweenMaxArray.push(recursiveTween);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 위치를 풀 가장 뒷자리로 옮겨주고 텍스쳐를 바꿔준다.
    ///////////////////////////////////////////////////////////////////////////
    private changeTextureAndRelocate(target_: CSymbol): void {
        const Y_POS_OUT_OF_BOUNDARY = 660;

        if(target_.sprite.y < Y_POS_OUT_OF_BOUNDARY) {
            return;
        }

        // 우선 풀에서 걸러준다.
        this.symbolPool = this.symbolPool.filter(item => item !== target_);
        const lastImgIdx = this.symbolPool.length - 1;

        // 제일 마지막 심볼 위 y값
        target_.sprite.y = this.symbolPool[lastImgIdx].sprite.y - Y_POS_GAP;

        // sequenceLocation을 증가시켜주고 값이 범위를 넘으면 보정해준다.
        this.sequenceLocation++;
        if(this.sequenceLocation >= SYMBOL_MANAGER.getSequenceLength(this.reelIdx)){
            this.sequenceLocation = 0;
        }

        // 새로운 텍스쳐로 바꿔준다.
        target_.sprite.texture = SYMBOL_MANAGER.getSymbolTextureBySequenceLocation(this.reelIdx, this.sequenceLocation)!;
        // 다시 풀에 넣는다.
        this.symbolPool.push(target_); 
    }

    ///////////////////////////////////////////////////////////////////////////
    // CSlot에서 reelStopLocation을 셋팅해준다.
    ///////////////////////////////////////////////////////////////////////////
    public SetReelStopLocation(stopLocation_: number): void {
        this.reelStopLocation = stopLocation_;
    }

    ///////////////////////////////////////////////////////////////////////////
    // bSpinning이 true 상태일 떄, 즉 릴이 돌 때만 매 프레임마다 동작을 가한다.
    // 속도를 조절, 멈춰야 할 준비, 실제로 멈추는 함수가 호출된다.
    ///////////////////////////////////////////////////////////////////////////
    public update(): void {
        if(this.bSpinning == false)
            return;

        this.controlSpinningSpeed();
        this.prepareToStop();
        this.stop();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 속도 조절 함수
    ///////////////////////////////////////////////////////////////////////////
    private controlSpinningSpeed(): void {
        this.spinningSpeed *= this.spinningSpeedController;
        if(this.spinningSpeed < MAX_SPINNING_SPEED) {
            this.spinningSpeed = MAX_SPINNING_SPEED;
        } else if(this.spinningSpeed > MIN_SPINNING_SPEED) {
            this.spinningSpeed = MIN_SPINNING_SPEED;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 멈출 준비를 하는 함수,
    // sequenceLocation을 reelStopLocation으로 부터 일정거리(DISTANCE_FROM_STOP_POINTER)에 있는 곳으로 옮긴다.
    // 후에 sequenceLocation이 reelStopLocation에 오면 릴이 멈추게 된다. -> 멈춘 사인을 받았을 때부터 실제 멈추기 전까지 약간의 텀을 두기 위해 이렇게 로직을 짰다.
    // bSelfPermission(자기 자신에게 멈춰도 된다는 사인을 보내는 변수)를 true로 만들고
    // spinningSpeedController를 DOWN시켜 릴이 돌아가는 속도를 줄인다.
    ///////////////////////////////////////////////////////////////////////////
    private prepareToStop(): void {
        //스탑 사인이 왔다.
        if(this.reelStopLocation == WAIT_FOR_STOP_SIGN) {
            return;
        }

        // 다른 릴로부터 멈춰도 된다고 허락을 받았다.
        if(this.bPrevReelPermission == false) {
            return;
        }

        // 아직 내 자신에게 멈추라고 허락을 받지 않은 상태여야 한다.
        if(this.bSelfPermission == true) {
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

    ///////////////////////////////////////////////////////////////////////////
    // reelStopLocation과 sequenceLocation이 같아져 진짜 멈출 때가 되었다.
    // 다음 릴에게 멈춰도 된다고 사인을 보내고
    // bSpinning을 false로 만든다.
    ///////////////////////////////////////////////////////////////////////////
    private stop(): void {
        if(this.bSelfPermission) {
            if(this.reelStopLocation == this.sequenceLocation) {
                if(this.nextAdjacentReel != null){
                    this.nextAdjacentReel.bPrevReelPermission = true;
                }
                this.bSpinning = false;
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 스크린에 보이는 심볼들이 모두 멈춰 제자리를 찾았다면 symbolsOnScreenMap의 사이즈가 4가 된다.
    ///////////////////////////////////////////////////////////////////////////
    public getCheckPossibility(): boolean {
        if(this.symbolsOnScreenMap.size == SYMBOLS_ON_SCREEN_LENGTH) {
            return true;
        }

        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 스크린에 보이는 심볼 맵을 반환한다.
    ///////////////////////////////////////////////////////////////////////////
    public getSymbolsOnScreenMap(): Map<number, Sprite> {
        return this.symbolsOnScreenMap;
    }
}