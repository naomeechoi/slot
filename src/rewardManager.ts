import { Graphics } from 'pixi.js';
import { APP } from './singleton';

const SHOW_LINE_TIME = 1000;

export default class CRewardManager {
    payLines: Array<Array<number>>;
    matchedLines: Array<Array<number>>;
    lineGraphics: Array<Graphics>;

    constructor(payLines_: Array<{line: Array<number>}>) {
        this.payLines = [];
        this.matchedLines = [];
        this.lineGraphics = [];

        this.payLines = new Array<Array<number>>;
        for(let i = 0; i < payLines_.length; i++){
            const curLine = payLines_[i];
            this.payLines.push(curLine.line);
        }
    }

    public checkMatchingToPayLines(arrayReels_: number[]) {
        for(const payLine of this.payLines) {

            let prevSymbolIdx = -1;
            let consecutiveCount = 0;
            for(const lineElement of payLine) {
                if(prevSymbolIdx == -1) {
                    prevSymbolIdx = arrayReels_[lineElement];
                    continue;
                }

                if(prevSymbolIdx == arrayReels_[lineElement]) {
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
    
    private drawLines() {
        for(const matchLine of this.matchedLines) {

            const realPath = new Graphics();
            for(let i = 0; i < matchLine.length; i++) {

                //const x = 208 + ()
                const y = 120 + (Math.floor((matchLine[i])/5) * 108) + (108 / 2);
                if(i == 0) {
                    realPath.moveTo(208, y);
                }

                const x = 208 + ((matchLine[i])%5) * 128 + (128/2);
                realPath.lineTo(x, y);

                if(i == matchLine.length - 1) {
                    realPath.lineTo(840, y);
                }
            }

            realPath.zIndex = 2;
            const randomColor = Math.floor(Math.random() * 0xFFFFFF) + 1;
            realPath.stroke({ width: 5, color: randomColor });
            APP.stage.addChild(realPath);
            this.lineGraphics.push(realPath);
        }

        setTimeout(() => {
            this.drawLinesOneByOne(0);
        }, SHOW_LINE_TIME*2);
    }

    private drawLinesOneByOne(nextVisibleLineIdx_: number) {
        if(this.lineGraphics.length == 0) {
            return;
        }

        for(const line of this.lineGraphics) {
            line.visible = false;
        }

        if(nextVisibleLineIdx_ >= this.lineGraphics.length) {
            nextVisibleLineIdx_ = -1;

            for(const line of this.lineGraphics) {
                line.visible = true;
            }
        }
        else {
            if(this.lineGraphics[nextVisibleLineIdx_]) {
                this.lineGraphics[nextVisibleLineIdx_].visible = true;
            }
        }

        setTimeout(() => {
            nextVisibleLineIdx_++;
            this.drawLinesOneByOne(nextVisibleLineIdx_);
        }, SHOW_LINE_TIME);
    }

    public clearLines() {
        this.matchedLines = [];
        for(const lineGraphic of this.lineGraphics) {
            APP.stage.removeChild(lineGraphic);
        }

        this.lineGraphics = [];
    }
}