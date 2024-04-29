import { Assets, Rectangle, Texture, AnimatedSprite } from "pixi.js";
import { APP } from "./singleton";

const WILD_CARD_NUM: number = 0;
const WILD_CARD_STR: RegExp = /\/0\.png$/;

///////////////////////////////////////////////////////////////////////////////
// 총 14개의 심볼 정보들
///////////////////////////////////////////////////////////////////////////////
class CSymbolInfo {
    private readonly uniqueNum: number;
    private readonly imgPath: string;
    private texture!: any;

    constructor(uniqueNum_: number, imgPath_: string) {
        this.uniqueNum = uniqueNum_;
        this.imgPath = imgPath_;
    }

    public async loadTexture(): Promise<void> {
        this.texture = await Assets.loader.load(this.imgPath);
    }

    public getUniqueNum(): number {
        return this.uniqueNum;
    }

    public getImgPath(): string {
        return this.imgPath;
    }

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

    // 와일드 카드 효과 관련
    private wildEffectFrames: Texture[] = [];
    private wildAnimatedSprites: AnimatedSprite[] = [];

    constructor(symbolInfo_: {identifyNum: number, path: string}[], sequenceInfo_: {stop: Array<number>}[], defaultSymbolsPos_: {x: number, y: number}[][]) {
        for(const symbol of symbolInfo_){
            const tempSymbolInfo = new CSymbolInfo(symbol.identifyNum, symbol.path);
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
    }

    ///////////////////////////////////////////////////////////////////////////
    // 싱글톤 패턴, 하나의 인스턴스만 보장
    ///////////////////////////////////////////////////////////////////////////
    public static getInstance(symbolInfo_: {identifyNum: number, path: string}[], sequenceInfo_: {stop: Array<number>}[], defaultSymbolsPos_: {x: number, y: number}[][]): CSymbolManager {
        if(this.instance == null) {
            this.instance = new CSymbolManager(symbolInfo_, sequenceInfo_, defaultSymbolsPos_);
        }

        return this.instance;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 텍스쳐들을 로드한다.
    ///////////////////////////////////////////////////////////////////////////////
    public async loadTextures(effectSpriteSheetPath_: string): Promise<void> {
        for(const symbol of this.symbolInfo){
            await symbol.loadTexture();
        }

        const spriteSheet = await Assets.loader.load(effectSpriteSheetPath_);
        const SPRITE_IMG_NUM = 25;
        const COL = 5;
        const ROW = 5;
        const WIDTH = 190.6;
        const HEIGHT = 185.8;
        for(let i = 0; i < SPRITE_IMG_NUM; i++) {
            const x = (i % COL) * WIDTH;
            const y = Math.floor(i / ROW) * HEIGHT;
            const tempTexture = new Texture({source: spriteSheet, frame: new Rectangle(x, y, WIDTH, 185.8)});
            this.wildEffectFrames.push(tempTexture);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 텍스쳐를 가져온다.
    ///////////////////////////////////////////////////////////////////////////////
    private getSymbolTexture(index_: number): Texture | null {
        const symbol = this.symbolInfo[index_];
        if(symbol == null)
            return null;

        return symbol.getTexture();
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

        return this.getSymbolTexture(symbolIdentifyNum);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 심볼 스크린상 기본 위치
    ///////////////////////////////////////////////////////////////////////////////
    public getDefaultSymbolsPos(): {x: number, y: number}[][] {
        return this.defaultSymbolsPos;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 와일드 카드인지 확인
    ///////////////////////////////////////////////////////////////////////////
    public isWildCard(value_: number | string | undefined): boolean {
        switch(typeof value_) {
            case "number": {
                if(value_ == WILD_CARD_NUM) {
                    return true;
                }
            } break;
            case "string": {
                if(value_.match(WILD_CARD_STR)) {
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

    ///////////////////////////////////////////////////////////////////////////////
    // 와일드 카드 이펙트 생성
    ///////////////////////////////////////////////////////////////////////////////
    public createWildEffect(x_: number, y_:number): void {
        let wildEffect = new AnimatedSprite(this.wildEffectFrames);
        wildEffect.position.set(x_, y_);
        wildEffect.width = 140;
        wildEffect.height = 120;
        wildEffect.animationSpeed = 0.5;
        wildEffect.loop = true;
        wildEffect.zIndex = 2;
        wildEffect.anchor.set(0.1);
        wildEffect.alpha = 0.8;
        wildEffect.play();

        this.wildAnimatedSprites.push(wildEffect);
        APP.stage.addChild(wildEffect);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // 와일드 카드 이펙트 삭제
    ///////////////////////////////////////////////////////////////////////////////
    public deleteWildEffect(): void {
        for(const animatedSprite of this.wildAnimatedSprites) {
            APP.stage.removeChild(animatedSprite);
        }
    }

}
