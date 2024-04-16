import { Application, Assets, Sprite } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
import CReel from "./reel"
const REEL_COUNT = 5;
const SPIN_TERM = 0;
const SPIN_TIME = 0;

export default class CSlot {
    private observerReels: Array<CReel>;

    constructor(){
        this.observerReels = new Array<CReel>;
    }

    public async setBackground() {
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

    // 릴 하나가 스핀이 끝났을 때 다음 릴에게 종료 가능 사인을 보내주기 위해 추가
    private setNextReel() : void {
        for(let i = 0; i < REEL_COUNT - 1; i++){
            this.observerReels[i].setNextReel(this.observerReels[i+1]);
        }
    }

    public setReel() : void {
        for(let i = 0; i < REEL_COUNT; i++){
            const tempReel = new CReel(i);
            tempReel.setReelImg();
            this.observerReels.push(tempReel);
        }

        this.setNextReel();
    }

    public update() : void {
        for(const reel of this.observerReels){
            reel.update();
        }
    }

    private startSpinning() : void {
        for(let i = 0; i < REEL_COUNT; i++){
            setTimeout(() => {
                this.observerReels[i].start();
                setTimeout(() => {
                    this.receiveMessageFromServer(0);
                }, SPIN_TIME);
            }, i * SPIN_TERM);
        }
    }

    private randomizeStopNumber() : Array<number> {
        let tempReelStopNumbers : Array<number> = [];
        for(let i = 0; i < REEL_COUNT; i++){
            const reelLength = SYMBOL_MANAGER.getSequenceLength(i);
            const randomReelNum = Math.floor(Math.random() * reelLength) + 1;
            tempReelStopNumbers.push(randomReelNum);
        }

        return tempReelStopNumbers;
    }

    private stopSpinning() : void {
        const reelStopNumbers = this.randomizeStopNumber(); 
        for(let i = 0; i < REEL_COUNT; i++){
            setTimeout(() => {
                this.observerReels[i].readyToStop(reelStopNumbers[i]);
            }, i * SPIN_TERM);
        }
    }

    public mouseEventFromClient(event_: MouseEvent) : void {
        this.startSpinning();
    }

    public receiveMessageFromServer(message_: number) : boolean {
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

    public SendMessageToServer() : void {

    }
}