import CSlot from "./slot";

const SLOT = new CSlot();
const FPS : number = 1000 / 60; 

main();

function main() {
    SLOT.SetDefaultUI();
    SLOT.loadGameElements();
    document.addEventListener("click", detectMouseEvent);
    setInterval(update, FPS);
}

function update() {

}

function detectMouseEvent(event: MouseEvent) {
    SLOT.mouseEventFromClient(event);
}