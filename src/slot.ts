import { Assets, Graphics, Sprite } from "pixi.js";
import { APP, REWARD_MANAGER, UTIL } from "./singleton"
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
    private startButton!: Graphics;
    private autoButton!: Graphics;
    private bAuto: boolean = false;
    private timeoutArray: NodeJS.Timeout[] = [];

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
        let texture = await Assets.loader.load('assets/background.png');

        // 백그라운드 생성
        const background = new Sprite(texture);

        // 백그라운드 이미지가 항상 위로 오도록
        background.zIndex = 1;

        APP.stage.addChild(background);

        // 백그라운드 텍스쳐 로드
        texture = await Assets.loader.load('assets/background2.png');

        // 백그라운드 생성
        const background2= new Sprite(texture);

        // 백그라운드 이미지가 항상 뒤에 오도록
        background2.zIndex = -1;

        APP.stage.addChild(background2);
    }

    ///////////////////////////////////////////////////////////////////////////
    // ui 셋팅
    ///////////////////////////////////////////////////////////////////////////
    public setUI(): void {
        // 시작 버튼
        this.startButton = new Graphics();
        this.startButton.circle(828, 638, 41);
        this.startButton.fill({alpha: 0.3});
        this.startButton.tint = 0xffef55;
        this.startButton.zIndex = 2;
        this.startButton.eventMode = 'static';
        this.startButton.cursor = 'pointer';
        this.startButton.on('pointerdown', this.startGame.bind(this));
        APP.stage.addChild(this.startButton);

        // 오토 플레이 버튼
        this.autoButton = new Graphics();
        this.autoButton.ellipse(708, 639, 43, 20);
        this.autoButton.fill(0xffef55);

        this.autoButton.moveTo(692, 630);
        this.autoButton.lineTo(732, 640);
        this.autoButton.lineTo(692, 650);
        this.autoButton.fill(0x04B45F);

        this.autoButton.zIndex = 2;
        this.autoButton.eventMode = 'static';
        this.autoButton.cursor = 'pointer';
        this.autoButton.on('pointerdown', this.autoGame.bind(this));
        APP.stage.addChild(this.autoButton);
    }

    ///////////////////////////////////////////////////////////////////////////
    // 릴 기본 셋팅
    ///////////////////////////////////////////////////////////////////////////
    public setReels(): void {
        for(let i = 0; i < REEL_COUNT; i++){
            const tempReel = new CReel(i);
            this.observerReels.push(tempReel);
        }

        // 릴에게 다음 릴들을 참조할 수 있게 한다.
        for(let i = 0; i < REEL_COUNT - 1; i++){
            if(this.observerReels[i] == null) {
                continue;
            }

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
                REWARD_MANAGER.checkResult(symbolSpritesOnSlot);
            }
        }

        if(REWARD_MANAGER.isFinishChecking()) {
            this.bCanStart = true;

            if(this.bAuto) {
                this.startGame();
            } else {
                this.startButton.cursor = 'pointer';
                this.startButton.tint = 0xffef55;
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

        UTIL.clearTimeout(this.timeoutArray);
        
        this.bCanStart = false;
        this.startButton.cursor = 'default';
        this.startButton.tint = 0x000000;

        // 시작할 때 라인 크레딧 고정
        REWARD_MANAGER.setLineCredit();

        for(let i = 0; i < REEL_COUNT; i++){
            const reelSpinTermTimeout = setTimeout(() => {
                if(this.observerReels[i] == null) {
                    return;
                }

                this.observerReels[i].start();
            }, i * SPIN_TERM);
            this.timeoutArray.push(reelSpinTermTimeout);
        }

        // SPIN_TIME이 끝난 후, 서버로 메시지 받았다고 가정한다.
        // SPIN_TIME이 끝난 후, 페이라인 체크를 시작한다.
        const spinTimeTimeout = setTimeout(() => {
            this.receiveMessageFromServer(0);
            this.bStartToCheckPayLines = true;
        }, SPIN_TIME);
        this.timeoutArray.push(spinTimeTimeout);

        // 리워드 관련 클리어
        REWARD_MANAGER.clear();
    }

    ///////////////////////////////////////////////////////////////////////////
    // 오토 플레이을 시작한다.
    ///////////////////////////////////////////////////////////////////////////
    private autoGame(): void {
        if(this.bAuto == false) {
            this.bAuto = true;
            this.startGame();

            this.autoButton.clear();
            this.autoButton.ellipse(708, 639, 43, 20);
            this.autoButton.fill(0xffef55);
    
            this.autoButton.rect(692, 630, 10, 20);
            this.autoButton.rect(712, 630, 10, 20);
            this.autoButton.fill(0x04B45F);
        } else {
            this.bAuto = false;

            this.autoButton.clear();
            this.autoButton.ellipse(708, 639, 43, 20);
            this.autoButton.fill(0xffef55);
    
            this.autoButton.moveTo(692, 630);
            this.autoButton.lineTo(732, 640);
            this.autoButton.lineTo(692, 650);
            this.autoButton.fill(0x04B45F);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // 릴들을 정지 시킨다.
    ///////////////////////////////////////////////////////////////////////////
    private stopSpinning(): void {
        for(let i = 0; i < REEL_COUNT; i++){
            const reelStopTermTimeout = setTimeout(() => {
                if(this.observerReels[i] == null) {
                    return;
                }

                // 심볼 시퀀스 길이 얻어 오기
                const reelLength = this.observerReels[i].getSymbolSequenceLength();

                // 랜덤 숫자 뽑기
                const randomReelNum = Math.floor(Math.random() * reelLength);

                // 스탑 릴 셋팅하기
                this.observerReels[i].SetReelStopLocation(randomReelNum);
            }, i * SPIN_TERM);
            this.timeoutArray.push(reelStopTermTimeout);
        }
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