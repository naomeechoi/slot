import { Assets, Sprite } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
import CReel from "./reel"
const REEL_COUNT = 5;
const SPIN_TERM = 300;
const SPIN_TIME = 0;

///////////////////////////////////////////////////////////////////////////////
export default class CSlot {
    private static instance: CSlot | null = null;
    private observerReels: CReel[] = [];
    private bStartToCheckPayLines: boolean = false;
    private bCanStart: boolean = true;

    private constructor(){
    }

    ///////////////////////////////////////////////////////////////////////////
    // 싱글톤 패턴, 하나의 인스턴스만 보장
    ///////////////////////////////////////////////////////////////////////////
    public static getInstance(): CSlot {
        if(this.instance == null) {
            this.instance = new CSlot();
        }

        return this.instance;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 백그라운드 셋팅
    ///////////////////////////////////////////////////////////////////////////
    public async setBackground(): Promise<void> {
        // Initialize the application
        await APP.init({ width:960, height: 720});

        // Append the application canvas to the document body
        document.body.appendChild(APP.canvas);

        // 백그라운드 텍스쳐 로드
        const texture = await Assets.loader.load('assets/background.png');

        // 백그라운드 생성
        const background = new Sprite(texture);

        // Move the sprite to the center of the screen
        background.x = 0;
        background.y = 0;

        // 백그라운드 이미지가 항상 위로 오도록
        background.zIndex = 1;

        APP.stage.addChild(background);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 릴 기본 셋팅
    ///////////////////////////////////////////////////////////////////////////
    public setReelDefault(): void {
        for(let i = 0; i < REEL_COUNT; i++){
            const tempReel = new CReel(i);
            tempReel.setSymbolsTexture();
            this.observerReels.push(tempReel);
        }

        // 릴에게 다음 릴들을 참조할 수 있게 한다.
        for(let i = 0; i < REEL_COUNT - 1; i++){
            this.observerReels[i].setNextAdjacentReel(this.observerReels[i+1]);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 매 프레임마다 업데이트 된다.
    ///////////////////////////////////////////////////////////////////////////
    public update(): void {
        for(const reel of this.observerReels){
            reel.update();
        }

        // 일정 시간 후 페이라인 체크를 시작한다.
        if(this.bStartToCheckPayLines) {

            // 릴들이 멈췄는지 체크한다.
            let stoppedReelCount: number = 0;
            for(const reel of this.observerReels){
                if(reel.getCheckPossibility()) {
                    stoppedReelCount++;
                }
            }

            // 모든 릴이 멈췄다.
            if(stoppedReelCount == REEL_COUNT) {
                this.bStartToCheckPayLines = false;

                // 화면에 나와있는 모든 심볼들의 아이덴티티를 담는다.
                let symbolSpritesOnSlot: Sprite[] = [];
                const ROWS = 4;
                for(let i = 0; i < ROWS; i++) {
                    for(let j = 0; j < this.observerReels.length; j++) {
                        const symbolSprite = this.observerReels[j].getSymbolsOnScreenMap().get(i);
                        if(symbolSprite != null) {
                            symbolSpritesOnSlot.push(symbolSprite);
                        } 
                    }
                }

                // 리워드 메니저가 계산하고 라인을 그리도록 정보를 넘겨준다.
                REWARD_MANAGER.checkPayLines(symbolSpritesOnSlot);

                // 시작하지 못하도록 잠시 막아둔다.
                setTimeout(() => {
                    this.bCanStart = true;
                }, 1000);
                
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 게임을 시작한다.
    ///////////////////////////////////////////////////////////////////////////
    private startGame(): void {
        if(this.bCanStart == false) {
            return;
        }
        
        this.bCanStart = false;
        for(let i = 0; i < REEL_COUNT; i++){
            setTimeout(() => {
                this.observerReels[i].start();
            }, i * SPIN_TERM);
        }

        // SPIN_TIME이 끝난 후, 서버로 메시지 받았다고 가정한다.
        // SPIN_TIME이 끝난 후, 페이라인 체크를 시작한다.
        setTimeout(() => {
            this.receiveMessageFromServer(0);
            this.bStartToCheckPayLines = true;
        }, SPIN_TIME);

        // 페이라인 그려진게 있다면 지운다.
        REWARD_MANAGER.clearLines();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 릴이 멈춰야할 위치를 랜덤으로 정한다.
    ///////////////////////////////////////////////////////////////////////////
    private randomizeStopNumber(): number[] {
        let reelStopNumbers: number[] = [];
        for(let i = 0; i < REEL_COUNT; i++){
            const reelLength = SYMBOL_MANAGER.getSequenceLength(i);
            const randomReelNum = Math.floor(Math.random() * reelLength);
            reelStopNumbers.push(randomReelNum);
        }

        return reelStopNumbers;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 릴들을 정지 시킨다.
    ///////////////////////////////////////////////////////////////////////////
    private stopSpinning(): void {
        const reelStopNumbers = this.randomizeStopNumber(); 
        for(let i = 0; i < REEL_COUNT; i++){
            setTimeout(() => {
                this.observerReels[i].SetReelStopLocation(reelStopNumbers[i]);
            }, i * SPIN_TERM);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 클릭 이벤트를 받아온다.
    ///////////////////////////////////////////////////////////////////////////
    public mouseEventFromClient(event_: MouseEvent): void {
        this.startGame();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 서버로부터 메시지를 받는다.
    ///////////////////////////////////////////////////////////////////////////
    public receiveMessageFromServer(message_: number): boolean {
        switch(message_) {
            case 0: {
                this.stopSpinning();
            }
            break;
            default: {

            }
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////
    // 서버로 메시지를 보낸다.
    ///////////////////////////////////////////////////////////////////////////
    public SendMessageToServer(): void {

    }
}