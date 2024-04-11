export default class CRewardManager {
    payLines: Array<Array<number>>;

    constructor(_paylines: Array<Array<number>>) {
        this.payLines = new Array<Array<number>>();
        
        for(const _payline of _paylines){
            this.payLines.push(_payline);
        }
       
        console.log(this.payLines);
    }
}