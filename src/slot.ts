import json from "./assets/data.json";

export default class CSlot {

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
        console.log(JSON_OBJECT["Strip"]);

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

/*
(async () =>
{
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

})();*/