export default class CRewardManager {
    payLines: Array<Array<number>>;

    constructor(payLines_: Array<Array<number>>) {
        this.payLines = new Array<Array<number>>();
        
        for(const payLine of payLines_){
            this.payLines.push(payLine);
        }
        //console.log(this.payLines);
    }
}