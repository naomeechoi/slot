import { Application, Assets, Sprite, Texture } from "pixi.js";

class CSymbol {
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
    symbols: Array<CSymbol>;
    symbolSequence: Array<number[]>;
    defaultSymbolsPos: Array<{x: number, y: number}[]>;

    constructor(symbolInfo_: Array<{index: number, path: string}>, sequenceInfo_: Array<{stop: number[]}>, defaultSymbolsPos_: Array<{x: number, y: number}[]>) {
        this.symbols = new Array<CSymbol>;
        for(const symbol of symbolInfo_){
            const tempSymbol = new CSymbol(symbol.index, symbol.path);
            this.symbols.push(tempSymbol);
        }

        this.symbolSequence = new Array<number[]>;
        for(let i = 0; i < sequenceInfo_.length; i++){
            const sequence = sequenceInfo_[i];
            this.symbolSequence.push(sequence.stop);
        }

        this.defaultSymbolsPos = new Array<{x: number, y: number}[]>;
        for(let i = 0; i < defaultSymbolsPos_.length; i++){
            const defaultSymbolPos = defaultSymbolsPos_[i];
            this.defaultSymbolsPos.push(defaultSymbolPos);
        }
    }

    public async loadTextures(){
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
    

     // 심볼 시퀀스에서 심볼 텍스쳐 가져오기
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
