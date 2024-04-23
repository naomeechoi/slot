import CSlot from "./slot";

const SLOT = CSlot.getInstance();
const FPS : number = 1000 / 60; 

main();

function main() {
    SLOT.setBackground();
    SLOT.setUI();
    SLOT.setReelDefault();
    document.addEventListener("click", detectMouseEvent);
    setInterval(update, FPS);
}

function update() {
    SLOT.update();
}

function detectMouseEvent(event: MouseEvent) {
    SLOT.mouseEventFromClient(event);
}