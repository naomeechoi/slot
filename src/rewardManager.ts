import { Sprite, Graphics, TextStyle, Text, Texture } from 'pixi.js';
import { TweenMax } from 'gsap/TweenMax';
import { APP, SYMBOL_MANAGER, UTIL, EAnimatedSprite } from './singleton';

const SHOW_LINE_TIME = 800;
const WHOLE_LINES_VISIBLE = -1;

const X_START = 168;
const Y_START = 124;
const WIDTH = 128;
const HEIGHT = 100;
const X_FINISH = 800;
const BORDER_OFFSET = 8
const BORDER_WIDTH = 5;
const Z_FOREMOST = 2;

///////////////////////////////////////////////////////////////////////////////
export default class CRewardManager {
    private static instance: CRewardManager | null = null;

    // 페이라인
    private readonly payLines: number[][] = [];

    // 맞춰진 라인에 대한 배열, 맞춰진 라인에 맞는 심볼 스트라이트에 대한 배열
    private matchedLines: (number[]|number)[] = [];
    private matchedSprites: Sprite[][] = [];
    private matchedScatters: Sprite[][] = [[], [], [], []];

    // 라인, 사각형, 라인마다 이긴 금액
    private lineGraphics: (Graphics|number)[] = [];
    private rectGraphics: (Graphics|number)[] = [];
    private lineWinTexts: Text[] = [];

    // 현재 어떤 라인이 보여지고 있는지
    private curVisibleLine: number = WHOLE_LINES_VISIBLE;
    
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

    private timeoutArray: NodeJS.Timeout[] = [];

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
        this.winText = new Text({x: 475, y:652, zIndex:2, text: 0, style});
        this.winText.visible = false;
        this.winText.anchor.set(0.5);
        APP.stage.addChild(this.winText);

        // 전체 베팅 금액 텍스트 셋팅
        style = new TextStyle({fontSize: 22, fill: '#ffffff'});
        this.totalBetText = new Text({x: 227, y:648, zIndex:2, text: UTIL.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]), style});
        this.totalBetText.anchor.set(0.5);
        APP.stage.addChild(this.totalBetText);

        // 전체 베팅 금액 변경 왼쪽 버튼
        this.totalBetLeftButton = new Graphics();
        this.totalBetLeftButton.rect(130, 627, 40, 40);
        this.totalBetLeftButton.fill({color: 0x66cc00, alpha: 0});
        this.totalBetLeftButton.zIndex = 2;
        this.totalBetLeftButton.eventMode = 'static';
        this.totalBetLeftButton.on('pointerdown', this.downTotalBet.bind(this));
        APP.stage.addChild(this.totalBetLeftButton);

        // 전체 베팅 금액 변경 오른쪽
        this.totalBetRightButton = new Graphics();
        this.totalBetRightButton.rect(285, 627, 40, 40);
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
            this.totalBetText.text = UTIL.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]);
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
            this.totalBetText.text = UTIL.addDollarSignAndCommaToNumber(this.totalBetArray[this.totalBetCurIdx]);
        }

        this.ControlTotalBetButtonCursor();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인 한 줄당 크레딧 설정
    ///////////////////////////////////////////////////////////////////////////
    public setLineCredit(): void {
        SYMBOL_MANAGER.setLineCredit(this.totalBetArray[this.totalBetCurIdx] / 125);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 돈 올리는 것까지 전부 끝났는지 확인
    ///////////////////////////////////////////////////////////////////////////
    public isFinishChecking(): boolean {
        if(this.bFinishedCheckResult == true) {
            this.bFinishedCheckResult = false;
            return true;
        }
        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 페이라인(결과)을 체크하고 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private checkScatters(symbolSpritesArray_: Sprite[]): void {
        for(const symbolSprite of symbolSpritesArray_) {
            if(SYMBOL_MANAGER.isScatterSymbol(symbolSprite.texture.label)) {
                const scatterNum = SYMBOL_MANAGER.whichScatterSymbol(symbolSprite.texture.label);
                if(scatterNum != -1) {
                    this.matchedScatters[scatterNum].push(symbolSprite);
                }
                this.matchedScatters[0].push(symbolSprite);
            }
        }

        // 동일 스케터 연속과 콤비네이션이 겹치지 않도록
        const THREE_SYMBOLS = 3;
        let prevScatter: Sprite | null = null;
        let count = 0;
        for(const scatter of this.matchedScatters[0]) {
            if(prevScatter === null) {
                prevScatter = scatter;
                count++;
                continue;
            }
            if(prevScatter.texture == scatter.texture) {
                count++;
            }
        }

        if(count == this.matchedScatters[0].length) {
            this.matchedScatters[0] = [];
        }

        for(let i = this.matchedScatters.length - 1; i >= 0; i--) {
            if(this.matchedScatters[i].length >= THREE_SYMBOLS) {
                this.matchedLines.push(i);
                this.matchedSprites.push([]);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 페이라인(결과)을 체크하고 라인을 그린다.
    ///////////////////////////////////////////////////////////////////////////
    public checkResult(symbolSpritesArray_: Sprite[]): void {
        if(this.totalBetArray[this.totalBetCurIdx] == null) {
            return;
        }

        this.checkScatters(symbolSpritesArray_);

        const PREV_SYMBOL_NOT_DECIDED = -1;
        const NO_MULTIPLIER = 0;
        for(const payLine of this.payLines) {
            let prevSymbolUniqueNum: number = PREV_SYMBOL_NOT_DECIDED;
            let matchedSpriteArray: Sprite[] = [];

            for(const lineElement of payLine) {
                let symbolUniqueNum = SYMBOL_MANAGER.getSymbolUniqueNumByTexture(symbolSpritesArray_[lineElement].texture);
                if(symbolUniqueNum == null) {
                    continue;     
                }

                if(prevSymbolUniqueNum == PREV_SYMBOL_NOT_DECIDED) {
                    prevSymbolUniqueNum = symbolUniqueNum;

                    // 스케터 심볼은 페이라인에 따라가지 않는다.
                    if(SYMBOL_MANAGER.isScatterSymbol(prevSymbolUniqueNum)) {
                        continue;
                    }

                    matchedSpriteArray.push(symbolSpritesArray_[lineElement]);
                    continue;
                }

                if(prevSymbolUniqueNum == symbolUniqueNum) {
                    matchedSpriteArray.push(symbolSpritesArray_[lineElement]);
                }
                else {
                    // 스케터 심볼은 와일드 심볼로 대체할 수 없다
                    if(SYMBOL_MANAGER.isWildSymbol(symbolUniqueNum)) {
                        matchedSpriteArray.push(symbolSpritesArray_[lineElement]);
                    } else {
                        break;
                    }
                }
            }

            // 보상에 곱해줄 값이 있는지 확인한다.
            const multiplier = SYMBOL_MANAGER.getWinAmountBySymbolUniqueNum(prevSymbolUniqueNum, matchedSpriteArray.length);
            if(multiplier > NO_MULTIPLIER) {
                this.matchedLines.push(payLine);
                this.matchedSprites.push(matchedSpriteArray);
            }
        }

        // 매치된 라인 없으면 끝낼 것 예약하고 있으면 선 그려준다.
        if(this.matchedLines.length == 0) {
            const finishTimeout = setTimeout(() => {
                this.bFinishedCheckResult = true;
            }, 500);

            this.timeoutArray.push(finishTimeout);
        } else {
            this.drawResult();
        }
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // 결과를 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawResult(): void {
        for(let i = 0; i < this.matchedLines.length; i++) {
            const RANDOM_COLOR = Math.floor(Math.random() * 0xFFFFFF) + 1;
            let oneLineWinAmount;
            const matchedLine = this.matchedLines[i];

            //라인 그리기
            this.drawLine(matchedLine, RANDOM_COLOR);

            //사각형 바운더리 그리기
            this.drawRect(i, RANDOM_COLOR);

            if(typeof matchedLine == "number") {
                oneLineWinAmount = SYMBOL_MANAGER.getScattersWinAmount(matchedLine, this.matchedScatters[matchedLine].length);
            } else {
                oneLineWinAmount = SYMBOL_MANAGER.getWinAmountBySymbolTexture(this.matchedSprites[i][0].texture, this.matchedSprites[i].length);
            }

            this.drawLineWinText(oneLineWinAmount, RANDOM_COLOR);
            // 총합에 더해주기
            this.win += oneLineWinAmount;
        }

        // 총합 윈 텍스트
        this.winText.visible = true;
        TweenMax.to(this.winText, 1, {text: this.win, onUpdate: () => {
            this.winText.text = UTIL.addDollarSignAndCommaToNumber(parseInt(this.winText.text));
        }, onComplete: () => {       
            const finishTimeout = setTimeout(() => {
            this.bFinishedCheckResult = true;
        }, this.getShowLInesTime());
        this.timeoutArray.push(finishTimeout);
    }});

        // 라인 하나씩 보여주기 위해서 준비
        const showLineOneByOneTimeout = setTimeout(() => {
            this.showLinesAndRectsOneByOne(0);
        }, SHOW_LINE_TIME * 2);
        this.timeoutArray.push(showLineOneByOneTimeout);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLine(matchedLine_: number[] | number, color_: number): void {
        if(typeof matchedLine_ == "number") {
            this.lineGraphics.push(matchedLine_);
            return;
        }

        const LINE_START = 0;
        let lineGraphic = new Graphics();
            for(let j = 0; j < matchedLine_.length; j++) {
                const Y = Y_START + (Math.floor((matchedLine_[j]) / 5) * HEIGHT) + (HEIGHT / 2);
                if(j == LINE_START) {
                    lineGraphic.moveTo(X_START, Y);
                }

                const x = X_START + ((matchedLine_[j]) % 5) * WIDTH + (WIDTH / 2);
                lineGraphic.lineTo(x, Y);

                if(j == matchedLine_.length - 1) {
                    lineGraphic.lineTo(X_FINISH, Y);
                }
            }
            lineGraphic.zIndex = Z_FOREMOST;
            lineGraphic.stroke({ width: BORDER_WIDTH, color: color_ });
            APP.stage.addChild(lineGraphic);
            this.lineGraphics.push(lineGraphic);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 사각형 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawRect(lineIdx_: number, color_: number): void {
        if(this.matchedSprites[lineIdx_].length == 0) {
            this.rectGraphics.push(0);
            return;
        }

        const rectGraphic = new Graphics();
        for(const matchedSprite of this.matchedSprites[lineIdx_]) {
            if(typeof matchedSprite == "number") {
                continue;
            }
            rectGraphic.rect(matchedSprite.x, matchedSprite.y, WIDTH - BORDER_OFFSET, HEIGHT);
            rectGraphic.stroke({ width: BORDER_WIDTH, color: color_ });
        }
        rectGraphic.zIndex = Z_FOREMOST;
        rectGraphic.visible = false;
        APP.stage.addChild(rectGraphic);
        this.rectGraphics.push(rectGraphic);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 라인 당 이긴 금액 그린다.
    ///////////////////////////////////////////////////////////////////////////
    private drawLineWinText(winAmount_: number, color_: number): void {
        let textContent: string = "Line Win Pays: " + winAmount_;
            let style = new TextStyle({fontSize: 18, fill: color_});
            let tempText = new Text({x: 150, y:555, zIndex:Z_FOREMOST, text: textContent, style});
            tempText.visible = false;
            APP.stage.addChild(tempText);
            this.lineWinTexts.push(tempText);
    }

    ///////////////////////////////////////////////////////////////////////////
    // visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setWholeGraphicsVisible(GraphicsArray_: (Graphics | number)[] | Text[], bVisible_: boolean): void {
        for(const graphic of GraphicsArray_) {
            if(graphic == null) {
                continue;
            }

            if(typeof graphic !== "number") {
                graphic.visible = bVisible_;
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // visible 설정
    ///////////////////////////////////////////////////////////////////////////
    private setSpecificGraphicsVisible(GraphicsArray_: (Graphics | number)[] | Text[], visibleIdx_: number): void {
        if(GraphicsArray_[visibleIdx_] == null || typeof GraphicsArray_[visibleIdx_] === "number") {
            return;
        }

        for(const graphic of GraphicsArray_) {
            if(graphic == null) {
                continue;
            }

            if(typeof graphic !== "number") {
                graphic.visible = false;
            }
        }
    
        let specificGraphic: Graphics | number | Text = GraphicsArray_[visibleIdx_];
        if(typeof specificGraphic !== "number") {
            specificGraphic.visible = true;
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
        this.setWholeGraphicsVisible(this.lineGraphics, false);
        this.setWholeGraphicsVisible(this.rectGraphics, false);
        this.setWholeGraphicsVisible(this.lineWinTexts, false);

        SYMBOL_MANAGER.deleteWholeEffect();

        // 보여질 라인에 대한 처리
        if(visibleLineIdx_ >= this.lineGraphics.length) {
            visibleLineIdx_ = -1;
            this.curVisibleLine = WHOLE_LINES_VISIBLE;

            // 라인이 다 보여져야 한다.
            this.setWholeGraphicsVisible(this.lineGraphics, true);
            this.setAllSymbolVisible(true);
        }
        else {
                let isNum = this.lineGraphics[visibleLineIdx_];
                if(typeof isNum == "number") {
                    this.setSpecificGraphicsVisible(this.lineWinTexts, visibleLineIdx_);
                    if(isNum == 0) {
                        SYMBOL_MANAGER.playScatterComboSymbolEffect(this.matchedScatters[isNum]);
                    } else {
                        SYMBOL_MANAGER.playScatterSymbolEffect(this.matchedScatters[isNum]);
                    }
                    
                    this.curVisibleLine = visibleLineIdx_;
                } else {
                    this.setSpecificGraphicsVisible(this.lineGraphics, visibleLineIdx_);
                    this.setSpecificGraphicsVisible(this.rectGraphics, visibleLineIdx_);
                    this.setSpecificGraphicsVisible(this.lineWinTexts, visibleLineIdx_);
                    // 와일드 심볼일 경우 이펙트를 틀어준다.
                
                    for(let symbolSprite of this.matchedSprites[visibleLineIdx_]) {
                        if(symbolSprite == null) {
                            continue;
                        }

                        if(SYMBOL_MANAGER.isWildSymbol(symbolSprite.texture.label)) {
                            SYMBOL_MANAGER.createEffect(EAnimatedSprite.wild, symbolSprite.x, symbolSprite.y);
                        }
                    }
                    
                    let blinkAtt: {line: number, visible: boolean, count: number} = {line:visibleLineIdx_, visible: true, count: 0};
                    this.curVisibleLine = visibleLineIdx_;
                    this.blinkSymbols(blinkAtt);
                }
            
        }

        const showLineOneByOneTimeout = setTimeout(() => {
            visibleLineIdx_++;
            this.showLinesAndRectsOneByOne(visibleLineIdx_);
        }, SHOW_LINE_TIME);
        this.timeoutArray.push(showLineOneByOneTimeout);
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
            //와일드 카드일 경우 깜박거리지 않는다.
            if(SYMBOL_MANAGER.isWildSymbol(symbolSprite.texture.label)
                || SYMBOL_MANAGER.isScatterSymbol(symbolSprite.texture.label)) {
                continue;
            }
            symbolSprite.visible = blinkAttr_.visible;
        }

        if(blinkAttr_.count < BLINK_COUNT) {
            blinkAttr_.count++;
            blinkAttr_.visible = !blinkAttr_.visible;
            const blinkTimeout = setTimeout(() => {
                this.blinkSymbols(blinkAttr_);
            }, SHOW_LINE_TIME / BLINK_COUNT);
            this.timeoutArray.push(blinkTimeout);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 오토 플레이에서 라인 보여주는 시간 정하기 위해
    ///////////////////////////////////////////////////////////////////////////
    private getShowLInesTime(): number {
        let count = this.matchedLines.length;
        if(this.matchedLines.length != 0) {
            count--;
        }
        
        return SHOW_LINE_TIME * 2.5 + count * SHOW_LINE_TIME;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 모든 라인을 없앤다.
    ///////////////////////////////////////////////////////////////////////////
    public clear(): void {
        this.setAllSymbolVisible(true);
        this.matchedLines = [];
        this.matchedSprites = [];
        this.matchedScatters = [[], [], [], []];
        
        for(const lineGraphic of this.lineGraphics) {
            if(lineGraphic == null || typeof lineGraphic == "number") {
                continue;
            }

            APP.stage.removeChild(lineGraphic);
        }
        this.lineGraphics = [];

        for(const rectGraphic of this.rectGraphics) {
            if(rectGraphic == null || typeof rectGraphic == "number") {
                continue;
            }

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

        SYMBOL_MANAGER.deleteWholeEffect();

        UTIL.clearTimeout(this.timeoutArray);
    }
}