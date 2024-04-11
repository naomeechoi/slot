class CSymbol {
    private readonly index: number;
    private readonly imgPath: string;

    constructor(_index : number, _imgPath : string) {
        this.index = _index;
        this.imgPath = _imgPath
    }

    public getIndex() : number {
        return this.index;
    }

    public getImgPath() : string {
        return this.imgPath;
    }
}

export default class CSymbolManager {
    symbols: Map<number, CSymbol>;
    symbolSequence: Map<number, number[]>;

    constructor(_symbolInfo: Array<{index: number, path: string}>, _sequenceInfo: Array<{stop: number[]}>) {
        this.symbols = new Map<number, CSymbol>;
        for(const symbol of _symbolInfo){
            const tempSymbol = new CSymbol(symbol.index, symbol.path);
            this.symbols.set(symbol.index, tempSymbol);
        }

        console.log(this.symbols);


        this.symbolSequence = new Map<number, number[]>;
        for(let i = 0; i < _sequenceInfo.length; i++){
            const sequence = _sequenceInfo[i];
            this.symbolSequence.set(i, sequence.stop);
        }

        console.log(this.symbolSequence);
    }

    public getSymbolImgPath(index: number) : string {
        const symbol = this.symbols.get(index);
        
        if(symbol == null)
            return "";

        return symbol.getImgPath();
    }

    // 다음 심볼 이미지 가져오기
    public getSymbolImgPathOnSequence(reelIdx: number, sequencePointer: number) : string {
        const curReelSequenceArray = this.symbolSequence.get(reelIdx);
        if(curReelSequenceArray == null)
            return "";

        const arrayLength = curReelSequenceArray.length;
        if(sequencePointer >= arrayLength){
            sequencePointer = 0;
        }

        const imgIdx = curReelSequenceArray[sequencePointer];

        return this.getSymbolImgPath(imgIdx);
    }
    
    /* 쓰일지 모르겠음
    public getSymbolIndexOnSequence(reelIdx: number, sequencePointer: number) : number {
        const curReelSequenceArray = this.symbolSequence.get(reelIdx);
        if(curReelSequenceArray == null)
            return -1;

        const arrayLength = curReelSequenceArray.length;
        if(sequencePointer >= arrayLength){
            sequencePointer = 0;
        }

        return curReelSequenceArray[sequencePointer];
    }
    */
}
