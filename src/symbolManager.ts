import { Assets, Rectangle, Texture, AnimatedSprite, Sprite } from "pixi.js";
import { APP, EAnimatedSprite } from "./singleton";

///////////////////////////////////////////////////////////////////////////////
// 총 14개의 심볼 정보들
///////////////////////////////////////////////////////////////////////////////
class CSymbolInfo {
    private readonly uniqueNum: number;
    private readonly imgPath: string;
    private readonly mulByConsecutiveCountMap: Map<number, number> = new Map;
    private texture!: Texture;

    constructor(uniqueNum_: number, imgPath_: string, rewards_: {key: number, value: number}[]) {
        this.uniqueNum = uniqueNum_;
        this.imgPath = imgPath_;
        rewards_.forEach(ele => {
            this.mulByConsecutiveCountMap.set(ele.key, ele.value);
        })
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼의 텍스쳐 로드
    ///////////////////////////////////////////////////////////////////////////
    public async loadTexture(): Promise<void> {
        this.texture = await Assets.loader.load(this.imgPath);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼의 고유 숫자
    ///////////////////////////////////////////////////////////////////////////
    public getUniqueNum(): number {
        return this.uniqueNum;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼의 이미지 경로
    ///////////////////////////////////////////////////////////////////////////
    public getImgPath(): string {
        return this.imgPath;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼 이미지의 연속된 갯수에 따라 결과 값에 곱해줘야 할 값
    ///////////////////////////////////////////////////////////////////////////
    public getMultiplier(consecutiveNum_: number): number {
        const NO_MULTIPLIER = 0;
        if(this.mulByConsecutiveCountMap == null) {
            return NO_MULTIPLIER;
        }

        const tempMultiplier = this.mulByConsecutiveCountMap.get(consecutiveNum_);
        if(tempMultiplier != null) {
            return tempMultiplier;
        }
        
        return NO_MULTIPLIER;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼 텍스쳐
    ///////////////////////////////////////////////////////////////////////////
    public getTexture(): Texture {
        return this.texture;
    }
}

///////////////////////////////////////////////////////////////////////////////
export default class CSymbolManager {
    private static instance: CSymbolManager | null = null;
    private readonly symbolInfo: CSymbolInfo[] = [];
    private readonly symbolSequence: number[][] = [];
    private readonly defaultSymbolsPos: {x: number, y: number}[][] = [];

    // 와일드 심볼 효과 관련
    private wildEffectFrames: Texture[] = [];
    private wildAnimatedSprites: AnimatedSprite[] = [];

    // 스케터 심볼 콤보 효과 관련
    private scatterComboEffectFrames: Texture[] = [];
    private scatterComboAnimatedSprites: AnimatedSprite[] = [];

    // 스케터 심볼 효과 관련
    private scatterEffectFrames: Texture[] = [];
    private scatterAnimatedSprites: AnimatedSprite[] = [];

    private lineCredit: number = 0;

    private ScatterCombinationMap: Map<number, number> = new Map;

    constructor(
        symbolInfo_: {identifyNum: number, path: string, mulByConsecutiveCount: {key: number, value: number}[]}[],
        sequenceInfo_: {stop: Array<number>}[],
        defaultSymbolsPos_: {x: number, y: number}[][],
        ScatterCombination_: {key: number, value: number}[]) {
        for(const symbol of symbolInfo_){
            const tempSymbolInfo = new CSymbolInfo(symbol.identifyNum, symbol.path, symbol.mulByConsecutiveCount);
            this.symbolInfo.push(tempSymbolInfo);
        }

        for(let i = 0; i < sequenceInfo_.length; i++){
            const sequence = sequenceInfo_[i];
            this.symbolSequence.push(sequence.stop);
        }

        for(let i = 0; i < defaultSymbolsPos_.length; i++){
            const defaultSymbolPos = defaultSymbolsPos_[i];
            this.defaultSymbolsPos.push(defaultSymbolPos);
        }

        ScatterCombination_.forEach(element => {
            this.ScatterCombinationMap.set(element.key, element.value);
        })
    }

    ///////////////////////////////////////////////////////////////////////////
    // 싱글톤 패턴, 하나의 인스턴스만 보장
    ///////////////////////////////////////////////////////////////////////////
    public static getInstance(
        symbolInfo_: {identifyNum: number, path: string, mulByConsecutiveCount: {key: number, value: number}[]}[],
        sequenceInfo_: {stop: Array<number>}[],
        defaultSymbolsPos_: {x: number, y: number}[][],
        ScatterCombination_: {key: number, value: number}[]): CSymbolManager {
        if(this.instance == null) {
            this.instance = new CSymbolManager(symbolInfo_, sequenceInfo_, defaultSymbolsPos_, ScatterCombination_);
        }

        return this.instance;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 텍스쳐들을 로드한다.
    ///////////////////////////////////////////////////////////////////////////////
    public async loadSpriteTextures(wildSpriteSheetPath_: string, scatterComboSpriteSheetPath_: string, scatterSpriteSheetPath_: string): Promise<void> {
        for(const symbol of this.symbolInfo){
            await symbol.loadTexture();
        }

        const wildSpriteSheet = await Assets.loader.load(wildSpriteSheetPath_);
        const SPRITE_IMG_NUM = 25;
        const COL = 5;
        const ROW = 5;
        const WIDTH = 192;
        const HEIGHT = 192;
        for(let i = 0; i < SPRITE_IMG_NUM; i++) {
            const x = (i % COL) * WIDTH;
            const y = Math.floor(i / ROW) * HEIGHT;
            const tempTexture = new Texture({source: wildSpriteSheet, frame: new Rectangle(x, y, WIDTH, HEIGHT)});
            this.wildEffectFrames.push(tempTexture);
        }

        const scatterComboSpriteSheet = await Assets.loader.load(scatterComboSpriteSheetPath_);
        for(let i = 0; i < SPRITE_IMG_NUM; i++) {
            const x = (i % COL) * WIDTH;
            const y = Math.floor(i / ROW) * HEIGHT;
            const tempTexture = new Texture({source: scatterComboSpriteSheet, frame: new Rectangle(x, y, WIDTH, HEIGHT)});
            this.scatterComboEffectFrames.push(tempTexture);
        }

        const scatterSpriteSheet = await Assets.loader.load(scatterSpriteSheetPath_);
        for(let i = 0; i < SPRITE_IMG_NUM; i++) {
            const x = (i % COL) * WIDTH;
            const y = Math.floor(i / ROW) * HEIGHT;
            const tempTexture = new Texture({source: scatterSpriteSheet, frame: new Rectangle(x, y, WIDTH, HEIGHT)});
            this.scatterEffectFrames.push(tempTexture);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 고유 번호를 가져온다.
    ///////////////////////////////////////////////////////////////////////////////
    public getSymbolUniqueNumByTexture(texture_: Texture): number | null {
        for(const symbol of this.symbolInfo) {
            if(symbol.getTexture() == texture_) {
                return symbol.getUniqueNum();
            }
        }

        return null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼들이 보여져야 하는 순서를 담고있는 시퀀스의 길이를 가져온다. 
    ///////////////////////////////////////////////////////////////////////////////
    public getSequenceLength(reelIdx_: number): number {
        const curReelSequenceArray = this.symbolSequence[reelIdx_];
        if(curReelSequenceArray == null){
            return 0;
        }

        return curReelSequenceArray.length;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 시퀀스 위치로 텍스쳐 가져오기
    ///////////////////////////////////////////////////////////////////////////////
    public getSymbolTextureBySequenceLocation(reelIdx_: number, sequenceLocation_: number): Texture | null {
        const sequenceArrayOnCurReel = this.symbolSequence[reelIdx_];
        if(sequenceArrayOnCurReel == null){
            return null;
        }
        const arrayLength = sequenceArrayOnCurReel.length;
        if(sequenceLocation_ >= arrayLength){
            sequenceLocation_ = 0;
        }

        const symbolIdentifyNum = sequenceArrayOnCurReel[sequenceLocation_];

        const symbol = this.symbolInfo[symbolIdentifyNum];
        if(symbol == null)
            return null;

        return symbol.getTexture();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 스크린상 기본 위치
    ///////////////////////////////////////////////////////////////////////////////
    public getDefaultSymbolsPos(): {x: number, y: number}[][] {
        return this.defaultSymbolsPos;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 와일드 심볼인지 확인
    ///////////////////////////////////////////////////////////////////////////
    public isWildSymbol(value_: number | string | undefined): boolean {
        switch(typeof value_) {
            case "number": {
                const WILD_NUM: number = 0;
                if(value_ == WILD_NUM) {
                    return true;
                }
            } break;
            case "string": {
                const WILD_STR: RegExp = /\/0\.png$/;
                if(value_.match(WILD_STR)) {
                    return true;
                }
            } break;
            case "undefined": {
                return false;
            } break;
            default: {
                return false;
            }
            break;
        }

        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 스케터 심볼인지 확인
    ///////////////////////////////////////////////////////////////////////////
    public isScatterSymbol(value_: number | string | undefined): boolean {
        switch(typeof value_) {
            case "number": {
                const SCATTERS = 1 | 2 | 3;
                if(value_ == SCATTERS) {
                    return true;
                }
            } break;
            case "string": {
                const SCATTERS_STR_1: RegExp = /\/1\.png$/;
                const SCATTERS_STR_2: RegExp = /\/2\.png$/;
                const SCATTERS_STR_3: RegExp = /\/3\.png$/;
                if(value_.match(SCATTERS_STR_1)
                    || value_.match(SCATTERS_STR_2)
                    || value_.match(SCATTERS_STR_3)) {
                    return true;
                }
            } break;
            case "undefined": {
                return false;
            } break;
            default: {
                return false;
            }
            break;
        }

        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 어떤 스케터 심볼인지 확인
    ///////////////////////////////////////////////////////////////////////////
    public whichScatterSymbol(value_: string | undefined): number {
        if(value_ == undefined) {
            return -1;
        }

        const SCATTERS_STR_1: RegExp = /\/1\.png$/;
        const SCATTERS_STR_2: RegExp = /\/2\.png$/;
        const SCATTERS_STR_3: RegExp = /\/3\.png$/;
        
        if(value_.match(SCATTERS_STR_1)) {
            return 1;
        } else if(value_.match(SCATTERS_STR_2)) {
            return 2;
        } else if(value_.match(SCATTERS_STR_3)) {
            return 3;
        }

        return -1;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 라인 한 개당 크레딧 얼마인지 셋팅
    ///////////////////////////////////////////////////////////////////////////////
    public setLineCredit(lineCredit_: number): void {
        this.lineCredit = lineCredit_;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 몇 배로 보상해줘야 하는지 심볼 유니크 번호로 찾기
    ///////////////////////////////////////////////////////////////////////////////
    public getWinAmountBySymbolUniqueNum(symbolUniqueNum_: number, consecutiveCount_: number): number {
        return this.lineCredit * this.symbolInfo[symbolUniqueNum_].getMultiplier(consecutiveCount_);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 몇 배로 보상해줘야 하는지 심볼 텍스쳐로 찾기
    ///////////////////////////////////////////////////////////////////////////////
    public getWinAmountBySymbolTexture(symbolTexture_: Texture, consecutiveCount_: number): number {
        const uniqueNum = this.getSymbolUniqueNumByTexture(symbolTexture_);
        if(uniqueNum != null) {
            return this.lineCredit * this.symbolInfo[uniqueNum].getMultiplier(consecutiveCount_);
        }

        return 0;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 스케터 몇 배로 보상해줘야 하는지
    ///////////////////////////////////////////////////////////////////////////////
    public getScattersWinAmount(matchedScatter_: number, combinationCount_: number) {
        const COMBO_MAX = 5;
        if(combinationCount_ > COMBO_MAX) {
            combinationCount_ = COMBO_MAX;
        }

        const COMBO = 0;
        let mul: number | undefined;
        if(matchedScatter_ == COMBO) {
            mul = this.ScatterCombinationMap.get(combinationCount_);
        } else {
            mul = this.symbolInfo[matchedScatter_].getMultiplier(combinationCount_)
        }

        if(mul === undefined) {
            return 0;
        }

        return this.lineCredit * mul;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 이펙트 생성
    ///////////////////////////////////////////////////////////////////////////////
    public createEffect(effect_: EAnimatedSprite, x_: number, y_:number): void {
        switch(effect_) {
            case EAnimatedSprite.wild: {
                let newEffect = new AnimatedSprite(this.wildEffectFrames);
                newEffect.position.set(x_ + -10, y_ + -15);
                newEffect.width = 140;
                newEffect.height = 120;
                newEffect.zIndex = 0;
                newEffect.animationSpeed = 0.45;
                newEffect.loop = true;
                newEffect.play();

                this.wildAnimatedSprites.push(newEffect);
                APP.stage.addChild(newEffect);

            } break;
            case EAnimatedSprite.scatterCombo: {
                let newEffect = new AnimatedSprite(this.scatterComboEffectFrames);
                newEffect.position.set(x_ + -40, y_ + -40);
                newEffect.width = 200;
                newEffect.height = 180;
                newEffect.zIndex = 2;
                newEffect.animationSpeed = 0.45;
                newEffect.loop = true;
                newEffect.play();

                this.scatterComboAnimatedSprites.push(newEffect);
                APP.stage.addChild(newEffect);
            } break;
            case EAnimatedSprite.scatter: {
                let newEffect = new AnimatedSprite(this.scatterEffectFrames);
                newEffect.position.set(x_ + -40, y_ + -40);
                newEffect.width = 200;
                newEffect.height = 180;
                newEffect.zIndex = 2;
                newEffect.animationSpeed = 0.85;
                newEffect.loop = true;
                newEffect.play();

                this.scatterAnimatedSprites.push(newEffect);
                APP.stage.addChild(newEffect);
            } break;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 스케터 콤보 이펙트 플레이
    ///////////////////////////////////////////////////////////////////////////////
    public playScatterComboSymbolEffect(matchedScatters_: Sprite[]): void {
        for(let scatter of matchedScatters_) {
            this.createEffect(EAnimatedSprite.scatterCombo, scatter.x, scatter.y);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 스케터 이펙트 플레이
    ///////////////////////////////////////////////////////////////////////////////
    public playScatterSymbolEffect(matchedScatters_: Sprite[]): void {
        for(let scatter of matchedScatters_) {
            this.createEffect(EAnimatedSprite.scatter, scatter.x, scatter.y);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 이펙트 전체 삭제
    ///////////////////////////////////////////////////////////////////////////////
    public deleteWholeEffect(): void {
        for(const animatedSprite of this.wildAnimatedSprites) {
            APP.stage.removeChild(animatedSprite);
        }

        for(const animatedSprite of this.scatterComboAnimatedSprites) {
            APP.stage.removeChild(animatedSprite);
        }

        for(const animatedSprite of this.scatterAnimatedSprites) {
            APP.stage.removeChild(animatedSprite);
        }
    }
}
