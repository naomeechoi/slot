import { Application, Assets, Sprite, Texture } from "pixi.js";

class CSymbolImg {
    private readonly index: number;
    private readonly imgPath: string;
    private texture!: any;

    constructor(index_ : number, imgPath_ : string) {
        this.index = index_;
        this.imgPath = imgPath_;
    }

    public async loadTexture() {
        this.texture = await Assets.loader.load(this.imgPath);
    }

    public getIndex() : number {
        return this.index;
    }

    public getImgPath() : string {
        return this.imgPath;
    }

    public getTexture() : any {
        return this.texture;
    }
}

export default class CSymbolManager {
    symbols: Array<CSymbolImg>;
    symbolSequence: Array<Array<number>>;
    defaultSymbolsPos: Array<Array<{x: number, y: number}>>;

    constructor(symbolInfo_: Array<{index: number, path: string}>, sequenceInfo_: Array<{stop: Array<number>}>, defaultSymbolsPos_: Array<Array<{x: number, y: number}>>) {
        this.symbols = new Array<CSymbolImg>;
        for(const symbol of symbolInfo_){
            const tempSymbol = new CSymbolImg(symbol.index, symbol.path);
            this.symbols.push(tempSymbol);
        }

        this.symbolSequence = new Array<Array<number>>;
        for(let i = 0; i < sequenceInfo_.length; i++){
            const sequence = sequenceInfo_[i];
            this.symbolSequence.push(sequence.stop);
        }

        this.defaultSymbolsPos = new Array<Array<{x: number, y: number}>>;
        for(let i = 0; i < defaultSymbolsPos_.length; i++){
            const defaultSymbolPos = defaultSymbolsPos_[i];
            this.defaultSymbolsPos.push(defaultSymbolPos);
        }
    }

    public async loadTextures() {
        for(const symbol of this.symbols){
            await symbol.loadTexture();
        }
    }

    private getSymbolTexture(index_: number) : Texture | null{
        const symbol = this.symbols[index_];
        if(symbol == null)
            return null;

        return symbol.getTexture();
    }

    public getSymbolIdxByTexture(texture_: Texture): number | null {
        for(const symbol of this.symbols) {
            if(symbol.getTexture() == texture_) {
                return symbol.getIndex();
            }
        }

        return null;
    }

    public getSequenceLength(reelIdx_: number) {
        const curReelSequenceArray = this.symbolSequence[reelIdx_];
        if(curReelSequenceArray == null){
            return 0;
        }

        return curReelSequenceArray.length;
    }

     // 심볼 시퀀스에서 심볼 텍스쳐 가져오기 lastSymbol: {idx: number};
    public getSymbolTextureOnSequence(reelIdx_: number, sequencePointer_: number) : Texture | null{
        const curReelSequenceArray = this.symbolSequence[reelIdx_];
        if(curReelSequenceArray == null){
            return null;
        }
        const arrayLength = curReelSequenceArray.length;
        if(sequencePointer_ >= arrayLength){
            sequencePointer_ = 0;
        }

        const imgIdx = curReelSequenceArray[sequencePointer_];

        return this.getSymbolTexture(imgIdx);
    }
}
