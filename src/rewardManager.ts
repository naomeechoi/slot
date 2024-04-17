export default class CRewardManager {
    payLines: number[][]; // Array<Array[number]>> [[1, 2], [1, 2], ]

    constructor(payLines_: number[][]) {
        this.payLines = [];
        
        for(const payLine of payLines_){
            this.payLines.push(payLine);
        }
        //console.log(this.payLines);
    }
}