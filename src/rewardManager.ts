import { Sprite, Graphics } from 'pixi.js';
import { APP, SYMBOL_MANAGER } from './singleton';

const SHOW_LINE_TIME = 500;

///////////////////////////////////////////////////////////////////////////////
export default class CRewardManager {
    private static instance: CRewardManager | null = null;
    private readonly payLines: number[][] = [];
    private matchedLines: number[][] = [];
    private lineGraphics: Graphics[] = [];

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
        for(const payLine of this.payLines) {

            let prevSymbolIdx = -1;
            let consecutiveCount = 0;
            for(const lineElement of payLine) {
                let symbolUniqueNum = SYMBOL_MANAGER.getSymbolUniqueNumByTexture(symbolSpritesArray_[lineElement].texture);
                if(symbolUniqueNum == null) {
                    continue;     
                }

                if(prevSymbolIdx == -1) {
                    prevSymbolIdx = symbolUniqueNum;
                    continue;
                }

                if(prevSymbolIdx == symbolUniqueNum) {
                    consecutiveCount++;
                }
                else {
                    break;
                }
            }

            if(consecutiveCount > 0) {
                this.matchedLines.push(payLine);
            }
        }
        this.drawLines();
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // 맞춰진 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLines(): void {
        if(this.matchedLines.length == 0) {
            return;
        }
        
        for(const matchLine of this.matchedLines) {

            const lineGraphic = new Graphics();
            for(let i = 0; i < matchLine.length; i++) {

                //const x = 208 + ()
                const y = 120 + (Math.floor((matchLine[i])/5) * 108) + (108 / 2);
                if(i == 0) {
                    lineGraphic.moveTo(208, y);
                }

                const x = 208 + ((matchLine[i])%5) * 128 + (128/2);
                lineGraphic.lineTo(x, y);

                if(i == matchLine.length - 1) {
                    lineGraphic.lineTo(840, y);
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
    // 모든 라인이 보여져야 하는지 셋팅한다.
    ///////////////////////////////////////////////////////////////////////////
    private setAllLinesVisibility(bVisible_: boolean): void {
        for(const lineGraphic of this.lineGraphics) {
            lineGraphic.visible = bVisible_;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인을 하나씩 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLinesOneByOne(nextVisibleLineIdx_: number): void {
        if(this.lineGraphics.length == 0) {
            return;
        }

        // 우선 다 안 보이게 처리한다.
        this.setAllLinesVisibility(false);

        // 보여질 라인에 대한 처리
        if(nextVisibleLineIdx_ >= this.lineGraphics.length) {
            nextVisibleLineIdx_ = -1;

            // 라인이 다 보여져야 한다.
            this.setAllLinesVisibility(true);
        }
        else {
            if(this.lineGraphics[nextVisibleLineIdx_] != null) {
                this.lineGraphics[nextVisibleLineIdx_].visible = true;
            }
        }

        setTimeout(() => {
            nextVisibleLineIdx_++;
            this.drawLinesOneByOne(nextVisibleLineIdx_);
        }, SHOW_LINE_TIME);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인을 없앤다.
    ///////////////////////////////////////////////////////////////////////////
    public clearLines(): void {
        this.matchedLines = [];
        for(const lineGraphic of this.lineGraphics) {
            APP.stage.removeChild(lineGraphic);
        }
        this.lineGraphics = [];
    }
}