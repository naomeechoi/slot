import { Sprite, Graphics, TextStyle, Text, textureBit } from 'pixi.js';
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER } from './singleton';

const SHOW_LINE_TIME = 800;
const WHOLE_LINES_VISIBLE = -1;

///////////////////////////////////////////////////////////////////////////////
export default class CRewardManager {
    private static instance: CRewardManager | null = null;

    // 페이라인
    private readonly payLines: number[][] = [];

    // 맞춰진 라인에 대한 배열, 맞춰진 라인에 맞는 심볼 스트라이트에 대한 배열
    private matchedLines: number[][] = [];
    private matchedSprites: Sprite[][] = [];

    // 라인, 사각형, 라인마다 이긴 금액
    private lineGraphics: Graphics[] = [];
    private rectGraphics: Graphics[] = [];
    private lineWinTexts: Text[] = [];

    // 현재 어떤 라인이 보여지고 있는지
    private curVisibleLine: number = WHOLE_LINES_VISIBLE;
    
    // 한 라인당 받을 수 있는 기초 금액
    private oneLineCredit: number = 0;
    
    // 이긴 금액
    private win: number = 0;
    private winText: Text;

    // 토탈 베팅 금액 관련
    private totalBetText: Text;
    private totalBetArray: number[] = [];
    private totalBetCurIdx: number = 0;
    private totalBetLeftButton: Graphics;
    private totalBetRightButton: Graphics;

    // 결과 체크 끝났는 지
    private bFinishedCheckResult: boolean = false;

    private constructor(payLines_: {line: number[]}[], totalBet_: number[]) {
        for(let i = 0; i < payLines_.length; i++){
            const curLine = payLines_[i];
            this.payLines.push(curLine.line);
        }

        for(const bet of totalBet_) {
            this.totalBetArray.push(bet);
        }

        if(this.payLines.length == 0 || this.totalBetArray.length == 0) {
            //TODO
            //게임 시작 되지 않게 막아야 함
        }

        // 이긴 금액 텍스트 셋팅
        let style = new TextStyle({fontSize: 28, fill: '#ffffff'});
        this.winText = new Text({x: 455, y:635, zIndex:2, text: 0, style});
        this.winText.visible = false;
        this.winText.anchor.set(0.5);
        APP.stage.addChild(this.winText);

        // 전체 베팅 금액 텍스트 셋팅
        style = new TextStyle({fontSize: 22, fill: '#ffffff'});
        this.totalBetText = new Text({x: 207, y:631, zIndex:2, text: this.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]), style});
        this.totalBetText.anchor.set(0.5);
        APP.stage.addChild(this.totalBetText);

        // 전체 베팅 금액 변경 왼쪽 버튼
        this.totalBetLeftButton = new Graphics();
        this.totalBetLeftButton.rect(110, 610, 40, 40);
        this.totalBetLeftButton.fill({color: 0x66cc00, alpha: 0});
        this.totalBetLeftButton.zIndex = 2;
        this.totalBetLeftButton.eventMode = 'static';
        this.totalBetLeftButton.on('pointerdown', this.downTotalBet.bind(this));
        APP.stage.addChild(this.totalBetLeftButton);

        // 전체 베팅 금액 변경 오른쪽
        this.totalBetRightButton = new Graphics();
        this.totalBetRightButton.rect(265, 610, 40, 40);
        this.totalBetRightButton.fill({color: 0x66cc00, alpha: 0});
        this.totalBetRightButton.zIndex = 2;
        this.totalBetRightButton.eventMode = 'static';
        this.totalBetRightButton.cursor = 'pointer';
        this.totalBetRightButton.on('pointerdown', this.upTotalBet.bind(this));
        APP.stage.addChild(this.totalBetRightButton);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 싱글톤 패턴, 하나의 인스턴스만 보장
    ///////////////////////////////////////////////////////////////////////////
    public static getInstance(payLines_: {line: number[]}[], totalBet_: number[]): CRewardManager {
        if(this.instance == null) {
            this.instance = new CRewardManager(payLines_, totalBet_);
        }

        return this.instance;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 컨트롤 토탈 벹 버튼
    ///////////////////////////////////////////////////////////////////////////
    private ControlTotalBetButtonCursor(): void {
        const LEFT_BOUNDARY = 0;
        const RIGHT_BOUNDARY = this.totalBetArray.length - 1;

        if(this.totalBetCurIdx > LEFT_BOUNDARY) {
            this.totalBetLeftButton.cursor = 'pointer';
        }
        else {
            this.totalBetLeftButton.cursor = 'default';
        }

        if(this.totalBetCurIdx < RIGHT_BOUNDARY) {
            this.totalBetRightButton.cursor = 'pointer';
        }
        else {
            this.totalBetRightButton.cursor = 'default';
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 토탈 벹 낮추기
    ///////////////////////////////////////////////////////////////////////////
    private downTotalBet(): void {
        if(this.totalBetArray[this.totalBetCurIdx] == null) {
            return;
        }

        if(this.totalBetCurIdx > 0) {
            this.totalBetCurIdx--;
            this.totalBetLeftButton.cursor = 'pointer';
            this.totalBetText.text = this.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]);
        }

        this.ControlTotalBetButtonCursor();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 토탈 벹 높이기
    ///////////////////////////////////////////////////////////////////////////
    private upTotalBet(): void {
        if(this.totalBetArray[this.totalBetCurIdx] == null) {
            return;
        }

        if(this.totalBetCurIdx < this.totalBetArray.length - 1) {
            this.totalBetCurIdx++;
            this.totalBetRightButton.cursor = 'pointer';
            this.totalBetText.text = this.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]);
        }

        this.ControlTotalBetButtonCursor();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 페이라인(결과)을 체크하고 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    public checkResult(symbolSpritesArray_: Sprite[]): void {
        if(this.totalBetArray[this.totalBetCurIdx] == null) {
            return;
        }

        const PREV_SYMBOL_NOT_DECIDED = -1;
        const ZERO_CONSECUTIVE = 0;

        this.oneLineCredit = this.totalBetArray[this.totalBetCurIdx] / 125;

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
        this.drawResult();
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // 맞춰진 라인, 사각형, 이긴 금액을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawResult(): void {
        if(this.matchedLines.length == 0) {
            this.bFinishedCheckResult = true;
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

            this.win += oneLineWinPay;
        }

        // 총합 윈 텍스트
        this.winText.visible = true;
        TweenMax.to(this.winText, 1, {text: this.win, onUpdate: () => {
            this.winText.text = this.addDollarSignAndCommaToNumber(parseInt(this.winText.text));
        }, onComplete: () => {       
            setTimeout(() => {
            this.bFinishedCheckResult = true;
        }, 300);}});

        // 라인 하나씩 보여주기 위해서 준비
        setTimeout(() => {
            this.showLinesAndRectsOneByOne(0);
        }, SHOW_LINE_TIME * 2);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 돈 올리는 것까지 전부 끝났는지 확인
    ///////////////////////////////////////////////////////////////////////////
    public isFinishedCheckResult() {
        return this.bFinishedCheckResult;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 오토 플레이에서 라인 보여주는 시간 정하기 위해
    ///////////////////////////////////////////////////////////////////////////
    public getShowLInesTime(): number {
        let count = this.matchedLines.length;
        if(this.matchedLines.length != 0) {
            count--;
        }
        return SHOW_LINE_TIME * 2 + count * SHOW_LINE_TIME;
    }

    ///////////////////////////////////////////////////////////////////////////
    // visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setGraphicsOrTextVisible(GraphicsArray_: Graphics[]|Text[], bVisible_: boolean, visibleIdx_:number = -1): void {
        if(visibleIdx_ != -1) {
            if(GraphicsArray_[visibleIdx_] == null) {
                return;
            }

            for(const graphic of GraphicsArray_) {
                graphic.visible = false;
            }

            GraphicsArray_[visibleIdx_].visible = true;
            return;
        }

        for(const graphic of GraphicsArray_) {
            graphic.visible = bVisible_;
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
    private showLinesAndRectsOneByOne(visibleLineIdx_: number): void {
        if(this.lineGraphics.length == 0) {
            return;
        }

        // 우선 다 안 보이게 처리한다.
        this.setGraphicsOrTextVisible(this.lineGraphics, false);
        this.setGraphicsOrTextVisible(this.rectGraphics, false);
        this.setGraphicsOrTextVisible(this.lineWinTexts, false);

        // 보여질 라인에 대한 처리
        if(visibleLineIdx_ >= this.lineGraphics.length) {
            visibleLineIdx_ = -1;
            this.curVisibleLine = WHOLE_LINES_VISIBLE;

            // 라인이 다 보여져야 한다.
            this.setGraphicsOrTextVisible(this.lineGraphics, true);
            this.setAllSymbolVisible(true);
        }
        else {
            if(this.lineGraphics[visibleLineIdx_] != null) {
                this.setGraphicsOrTextVisible(this.lineGraphics, false, visibleLineIdx_);
                this.setGraphicsOrTextVisible(this.rectGraphics, false, visibleLineIdx_);
                this.setGraphicsOrTextVisible(this.lineWinTexts, false, visibleLineIdx_);

                let blinkAtt: {line: number, visible: boolean, count: number} = {line:visibleLineIdx_, visible: true, count: 0};
                this.curVisibleLine = visibleLineIdx_;
                this.blinkSymbols(blinkAtt);
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
        
        if(this.matchedSprites[blinkAttr_.line] == null) {
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

        this.win = 0;
        this.winText.visible = false;
        this.winText.text = 0;
        this.bFinishedCheckResult = false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 돈 표시에 달러 사인, 콤마 추가 하기
    ///////////////////////////////////////////////////////////////////////////
    private addDollarSignAndCommaToNumber(number_: number | string): string {
        if(typeof number_ == "string") {
            number_ = parseInt(number_);
        }

        // 콤마를 몇 개 찍어야 하는지 계산
        let commaCount: number = 0;
        let tempNum: number = number_;
        while(tempNum >= 1000) {
            commaCount++;
            tempNum /= 1000;
        }

        // 찍을 콤마 없다면 리턴
        if(commaCount == 0) {
            if(number_ > 0) {
                return number_.toString();
            }
            else {
                return "";
            }
        }

        // 콤마 추가
        let numberStr = number_.toString();
        let textParts: string[] = numberStr.split('').reverse();
        while(commaCount > 0) {
            textParts.splice(commaCount * 3, 0, ',');
            commaCount--;
        }
        
        // 달러 표시 달고 배열 합치기
        let result: string = "$";
        for(let i = textParts.length - 1; i >= 0; i--) {
            result += textParts[i];
        }
        
        return result;
    }
}