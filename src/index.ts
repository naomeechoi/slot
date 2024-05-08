import CSlot from "./slot";

const SLOT = CSlot.getInstance();
const FPS : number = 1000 / 60; 

main();

function main() {
    SLOT.setBackground();
    SLOT.setReels();
    SLOT.setUI();
    setInterval(update, FPS);
}

function update() {
    SLOT.update();
}