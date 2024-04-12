import { Application, Assets, Sprite } from "pixi.js";
import { APP, SYMBOL_MANAGER, REWARD_MANAGER } from "./singleton"
import CReel from "./reel"
const REEL_COUNT = 5;
const TERM = 300;

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

    public setReel(){
        for(let i = 0; i < REEL_COUNT; i++){
            const tempReel = new CReel(i);
            tempReel.setReelImg();
            this.observerReels.push(tempReel);
        }
    }

    public update(){
        for(const reel of this.observerReels){
            reel.update();
        }
    }

    public mouseEventFromClient(event_: MouseEvent) : void {
        for(let i = 0; i < REEL_COUNT; i++){
            setTimeout(() => {
                this.observerReels[i].setSpinningStatus(true);
            }, i * TERM);
        }
    }

    public receiveMessageFromServer() : boolean {
        return true;
    }

    public SendMessageToServer() : void {

    }
}