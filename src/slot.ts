import json from "./assets/data.json";

export default class CSlot {

    public loadGameElements() : boolean {

        this.loadDataPromise()
            .then(result => {
                return this.createGameElementPromise(result)
                    .then(result => {
                        console.log('created game elements successfully');
                        return result;
                    })
                    .catch(error => {
                        console.log('fail to create game elements');
                        return error;
                    })
            })
            .catch(error => {
                console.log('load data failed: ', error);
                return false;
            })

        return false;
    }

    private async loadDataPromise() : Promise<string> {
        return new Promise((resolve, reject) => {
            const JSONSTRING = JSON.stringify(json);
            if(JSONSTRING === null || JSONSTRING === undefined) {
                reject("failed to create json obj");
            } else {
                resolve(JSONSTRING);
            }
        })
    }

    private async createGameElementPromise(data: string) : Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(this.createGameElement(data)){
                resolve(true);
            }
            else{
                reject(false);
            }
        })
    }

    private createGameElement(data: string) : boolean {
        const JSONOBJECT = JSON.parse(data);
        if(JSONOBJECT === null || JSONOBJECT === undefined) {
            return false;
        }

        console.log(JSONOBJECT["Strip"]);

        return true;
    }

    public receiveEventFromClient(event: MouseEvent) : void {
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