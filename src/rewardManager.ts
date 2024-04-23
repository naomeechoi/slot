import { Sprite, Graphics } from 'pixi.js';
import { APP, SYMBOL_MANAGER } from './singleton';

const SHOW_LINE_TIME = 800;
const WHOLE_LINES_VISIBLE = -1;

///////////////////////////////////////////////////////////////////////////////
export default class CRewardManager {
    private static instance: CRewardManager | null = null;
    private readonly payLines: number[][] = [];
    private matchedLines: number[][] = [];
    private matchedSprites: Sprite[][] = [];
    private lineGraphics: Graphics[] = [];
    private curVisibleLine: number = WHOLE_LINES_VISIBLE;

    private constructor(payLines_: {line: number[]}[]) {
        for(let i = 0; i < payLines_.length; i++){
            const curLine = payLines_[i];
            this.payLines.push(curLine.line);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 싱글톤 패턴, 하나의 인스턴스만 보장
    ///////////////////////////////////////////////////////////////////////////
    public static getInstance(payLines_: {line: number[]}[]): CRewardManager {
        if(this.instance == null) {
            this.instance = new CRewardManager(payLines_);
        }

        return this.instance;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 페이라인(결과)을 체크하고 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    public checkPayLines(symbolSpritesArray_: Sprite[]): void {
        const PREV_SYMBOL_NOT_DECIDED = -1;
        const ZERO_CONSECUTIVE = 0;

        for(const payLine of this.payLines) {
            let prevSymbolUniqueNum: number = PREV_SYMBOL_NOT_DECIDED;
            let consecutiveSymbolCount: number = ZERO_CONSECUTIVE;
            let matchedSpriteArray: Sprite[] = [];

            for(const lineElement of payLine) {
                let symbolUniqueNum = SYMBOL_MANAGER.getSymbolUniqueNumByTexture(symbolSpritesArray_[lineElement].texture);
                if(symbolUniqueNum == null) {
                    continue;     
                }

                if(prevSymbolUniqueNum == PREV_SYMBOL_NOT_DECIDED) {
                    prevSymbolUniqueNum = symbolUniqueNum;
                    matchedSpriteArray.push(symbolSpritesArray_[lineElement]);
                    continue;
                }

                if(prevSymbolUniqueNum == symbolUniqueNum) {
                    matchedSpriteArray.push(symbolSpritesArray_[lineElement]);
                    consecutiveSymbolCount++;
                }
                else {
                    break;
                }
            }

            if(consecutiveSymbolCount > ZERO_CONSECUTIVE) {
                this.matchedLines.push(payLine);
                this.matchedSprites.push(matchedSpriteArray);
            }
        }
        this.drawLines();
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // 맞춰진 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLines(): void {
        const X_START = 208;
        const Y_START = 120;
        const X_GAP = 128;
        const Y_GAP = 109;
        const LINE_START = 0;
        const X_FINISH = 840;

        if(this.matchedLines.length == 0) {
            return;
        }
        
        for(const matchLine of this.matchedLines) {
            const lineGraphic = new Graphics();
            for(let i = 0; i < matchLine.length; i++) {
                const y = Y_START + (Math.floor((matchLine[i]) / 5) * Y_GAP) + (Y_GAP / 2);
                if(i == LINE_START) {
                    lineGraphic.moveTo(X_START, y);
                }

                const x = X_START + ((matchLine[i]) % 5) * X_GAP + (X_GAP / 2);
                lineGraphic.lineTo(x, y);

                if(i == matchLine.length - 1) {
                    lineGraphic.lineTo(X_FINISH, y);
                }
            }

            lineGraphic.zIndex = 2;
            const randomColor = Math.floor(Math.random() * 0xFFFFFF) + 1;
            lineGraphic.stroke({ width: 5, color: randomColor });
            APP.stage.addChild(lineGraphic);
            this.lineGraphics.push(lineGraphic);
        }

        setTimeout(() => {
            this.drawLinesOneByOne(0);
        }, SHOW_LINE_TIME * 2);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인의 visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setAllLinesVisibility(bVisible_: boolean): void {
        for(const lineGraphic of this.lineGraphics) {
            lineGraphic.visible = bVisible_;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 심볼의 visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setAllSymbolVisible(bVisible_: boolean): void {
        for(let matchedSpriteArray of this.matchedSprites) {
            for(let matchedSprite of matchedSpriteArray) {
                matchedSprite.visible = bVisible_;
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인을 하나씩 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLinesOneByOne(visibleLineIdx_: number): void {
        if(this.lineGraphics.length == 0) {
            return;
        }

        // 우선 다 안 보이게 처리한다.
        this.setAllLinesVisibility(false);

        // 보여질 라인에 대한 처리
        if(visibleLineIdx_ >= this.lineGraphics.length) {
            visibleLineIdx_ = -1;
            this.curVisibleLine = WHOLE_LINES_VISIBLE;

            // 라인이 다 보여져야 한다.
            this.setAllLinesVisibility(true);
            this.setAllSymbolVisible(true);
        }
        else {
            if(this.lineGraphics[visibleLineIdx_] != null) {
                this.lineGraphics[visibleLineIdx_].visible = true;

                let blinkAtt: {line: number, visible: boolean, count: number} = {line:visibleLineIdx_, visible: true, count: 0};
                this.curVisibleLine = visibleLineIdx_;
                this.blinkSymbols(blinkAtt);
            }
        }

        setTimeout(() => {
            visibleLineIdx_++;
            this.drawLinesOneByOne(visibleLineIdx_);
        }, SHOW_LINE_TIME);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 심볼을 깜박이게 한다.
    ///////////////////////////////////////////////////////////////////////////
    private blinkSymbols(blinkAttr_: {line: number, visible: boolean, count: number}): void {
        const BLINK_COUNT = 4;

        if(this.curVisibleLine == WHOLE_LINES_VISIBLE) {
            return;
        }
        
        for(let symbolSprite of this.matchedSprites[blinkAttr_.line]) {
            symbolSprite.visible = blinkAttr_.visible;
        }

        if(blinkAttr_.count < BLINK_COUNT) {
            blinkAttr_.count++;
            blinkAttr_.visible = !blinkAttr_.visible;
            setTimeout(() => {
                this.blinkSymbols(blinkAttr_);
            }, SHOW_LINE_TIME / BLINK_COUNT);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인을 없앤다.
    ///////////////////////////////////////////////////////////////////////////
    public clearLines(): void {
        this.setAllSymbolVisible(true);
        this.matchedSprites = [];
        
        this.matchedLines = [];
        for(const lineGraphic of this.lineGraphics) {
            APP.stage.removeChild(lineGraphic);
        }
        this.lineGraphics = [];
        this.curVisibleLine = WHOLE_LINES_VISIBLE;
    }
}