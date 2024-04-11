import { Application, Assets, Sprite } from "pixi.js";
import json from "./assets/data.json";
import CSymbolManager from "./symbolManager"
import CRewardManager from "./rewardManager"

export default class CSlot {

    private symbolManager! : CSymbolManager;
    private rewardManager! : CRewardManager;

    public async SetDefaultUI() {
    
        // Create a new application
        const app = new Application();

        // Initialize the application
        await app.init({ width:960, height: 720});

        // Append the application canvas to the document body
        document.body.appendChild(app.canvas);

        // Load the bunny texture
        const texture = await Assets.loader.load('assets/background.png');

        // Create a bunny Sprite
        const background = new Sprite(texture);

        // Move the sprite to the center of the screen
        background.x = 0;
        background.y = 0;

        app.stage.addChild(background);
    }

    public loadGameElements() : boolean {
        const DATA_STR = JSON.stringify(json);
        if(DATA_STR)
        {
            if(this.createGameElements(DATA_STR))
                {
                    return true;
                }
        } 
        return false;
    }

    private createGameElements(data: string) : boolean {
        const JSON_OBJECT = JSON.parse(data);
        if(JSON_OBJECT === null || JSON_OBJECT === undefined) {
            return false;
        }

        // 게임 요소들 만드는 로직
        this.symbolManager = new CSymbolManager(JSON_OBJECT["SymbolInfo"], JSON_OBJECT["Strip"]);
        this.rewardManager = new CRewardManager(JSON_OBJECT["PayLines"]);

        return true;
    }

    public mouseEventFromClient(event: MouseEvent) : void {
        console.log("dddddddddddddd");
    }

    public receiveMessageFromServer() : boolean {
        return true;
    }

    public SendMessageToServer() : void {

    }
}