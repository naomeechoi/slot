import { Application, Assets, Sprite } from 'pixi.js';

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

})();