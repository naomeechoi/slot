import { Sprite, Graphics, TextStyle, Text } from 'pixi.js';
import { TweenMax } from 'gsap/TweenMax';
import { FANCY_TEXT, APP, SYMBOL_MANAGER } from './singleton';

const SHOW_LINE_TIME = 800;
const WHOLE_LINES_VISIBLE = -1;

///////////////////////////////////////////////////////////////////////////////
export default class CRewardManager {
    private static instance: CRewardManager | null = null;
    private readonly payLines: number[][] = [];
    private matchedLines: number[][] = [];
    private matchedSprites: Sprite[][] = [];
    private lineGraphics: Graphics[] = [];
    private rectGraphics: Graphics[] = [];
    private lineWinTexts: Text[] = [];
    private totalWinText: Text;
    private curVisibleLine: number = WHOLE_LINES_VISIBLE;
    private oneLineCredit: number = 0;
    private totalWin: number = 0;

    private constructor(payLines_: {line: number[]}[]) {
        for(let i = 0; i < payLines_.length; i++){
            const curLine = payLines_[i];
            this.payLines.push(curLine.line);
        }

        const style = new TextStyle({fontSize: 30, fill: '#ffffff'});
        this.totalWinText = new Text({x: 380, y:618, zIndex:2, text: 0, style});
        this.totalWinText.visible = false;
        APP.stage.addChild(this.totalWinText);
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
    public checkResult(totalBet_: number, symbolSpritesArray_: Sprite[]): void {
        const PREV_SYMBOL_NOT_DECIDED = -1;
        const ZERO_CONSECUTIVE = 0;

        this.oneLineCredit = totalBet_ / 125;

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
        this.drawLinesAndRects();
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // 맞춰진 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLinesAndRects(): void {
        if(this.matchedLines.length == 0) {
            return;
        }

        const X_START = 208;
        const Y_START = 120;
        const WIDTH = 128;
        const HEIGHT = 108;
        const LINE_START = 0;
        const X_FINISH = 840;
        const BORDER_OFFSET = 8;

        const BORDER_WIDTH = 5;
        const Z_FRONT = 2;
        
        for(let i = 0; i < this.matchedLines.length; i++) {
            const RANDOM_COLOR = Math.floor(Math.random() * 0xFFFFFF) + 1;

            //라인 그리기
            const matchedLine = this.matchedLines[i];
            const lineGraphic = new Graphics();
            for(let j = 0; j < matchedLine.length; j++) {
                const y = Y_START + (Math.floor((matchedLine[j]) / 5) * HEIGHT) + (HEIGHT / 2);
                if(j == LINE_START) {
                    lineGraphic.moveTo(X_START, y);
                }

                const x = X_START + ((matchedLine[j]) % 5) * WIDTH + (WIDTH / 2);
                lineGraphic.lineTo(x, y);

                if(j == matchedLine.length - 1) {
                    lineGraphic.lineTo(X_FINISH, y);
                }
            }
            lineGraphic.zIndex = Z_FRONT;
            lineGraphic.stroke({ width: BORDER_WIDTH, color: RANDOM_COLOR });
            APP.stage.addChild(lineGraphic);
            this.lineGraphics.push(lineGraphic);

            //사각형 바운더리 그리기
            const rectGraphic = new Graphics();
            for(const matchedSprite of this.matchedSprites[i]) {
                rectGraphic.rect(matchedSprite.x, matchedSprite.y, WIDTH - BORDER_OFFSET, HEIGHT - BORDER_OFFSET);
                rectGraphic.stroke({ width: BORDER_WIDTH, color: RANDOM_COLOR });
            }
            rectGraphic.zIndex = Z_FRONT;
            rectGraphic.visible = false;
            APP.stage.addChild(rectGraphic);
            this.rectGraphics.push(rectGraphic);

            // 라인 윈 페이 텍스트 그리기
            let style = new TextStyle({fontSize: 12, fill: RANDOM_COLOR});
            let oneLineWinPay = this.oneLineCredit * 100;
            let textContent: string = "Line Win Pays: " + oneLineWinPay;
            let tempText = new Text({x: 150, y:555, zIndex:Z_FRONT, text: textContent, style});
            tempText.visible = false;
            APP.stage.addChild(tempText);
            this.lineWinTexts.push(tempText);

            this.totalWin += oneLineWinPay;
            console.log('total: ' + this.totalWin + ' oneLineWin: ' + oneLineWinPay + ' lineCount: ' + this.matchedLines.length);
        }

        // 총합 윈 텍스트
        this.totalWinText.visible = true;
        TweenMax.to(this.totalWinText, 1, {text: this.totalWin, onUpdate: () => {
            this.totalWinText.text = FANCY_TEXT(parseInt(this.totalWinText.text));
        }})

        setTimeout(() => {
            this.showLinesAndRectsOneByOne(0);
        }, SHOW_LINE_TIME * 2);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인의 visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setAllLinesVisible(bVisible_: boolean): void {
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
    // 모든 심볼의 외곽선 visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setAllSymbolBorderVisible(bVisible_: boolean): void {
        for(const rectGraphic of this.rectGraphics) {
            rectGraphic.visible = bVisible_;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인 윈 페이 visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setAllLineWinPaysVisible(bVisible_: boolean): void {
        for(const lineWinText of this.lineWinTexts) {
            lineWinText.visible = bVisible_;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인을 하나씩 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private showLinesAndRectsOneByOne(visibleLineIdx_: number): void {
        if(this.lineGraphics.length == 0) {
            return;
        }

        // 우선 다 안 보이게 처리한다.
        this.setAllLinesVisible(false);
        this.setAllSymbolBorderVisible(false);
        this.setAllLineWinPaysVisible(false);

        // 보여질 라인에 대한 처리
        if(visibleLineIdx_ >= this.lineGraphics.length) {
            visibleLineIdx_ = -1;
            this.curVisibleLine = WHOLE_LINES_VISIBLE;

            // 라인이 다 보여져야 한다.
            this.setAllLinesVisible(true);
            this.setAllSymbolVisible(true);
        }
        else {
            if(this.lineGraphics[visibleLineIdx_] != null) {
                this.lineGraphics[visibleLineIdx_].visible = true;

                let blinkAtt: {line: number, visible: boolean, count: number} = {line:visibleLineIdx_, visible: true, count: 0};
                this.curVisibleLine = visibleLineIdx_;
                this.blinkSymbols(blinkAtt);

                this.rectGraphics[visibleLineIdx_].visible = true;
                this.lineWinTexts[visibleLineIdx_].visible = true;
            }
        }

        setTimeout(() => {
            visibleLineIdx_++;
            this.showLinesAndRectsOneByOne(visibleLineIdx_);
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

        for(const rectGraphic of this.rectGraphics) {
            APP.stage.removeChild(rectGraphic);
        }
        this.rectGraphics = [];

        for(const lineWinText of this.lineWinTexts) {
            APP.stage.removeChild(lineWinText);
        }
        this.lineWinTexts = [];

        this.curVisibleLine = WHOLE_LINES_VISIBLE;

        this.totalWin = 0;
        this.totalWinText.visible = false;
        this.totalWinText.text = 0;
    }
}