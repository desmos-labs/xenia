

import 'dotenv/config';

const  mins = process.env.Min;

const XeniaBot = require("./XeniaBotCore.js")

//let  test = 1 * 60000  


const cyclicTime = mins * 60 * 1000 // cyclic time to elect active valdito to delegate 


//const low = require('lowdb')
//const FileSync = require('lowdb/adapters/FileSync')

//const adapter = new FileSync('db.json')
//const db = low(adapter)

//const turnRoulette = db.get('xRoulette');
// db.defaults({ history: [] })
//   .write()


 //handle the bot autonmous    
 const automata = ()=> {
    let prevHeight =  XeniaBot.rouletteHistory.value()
    if(isNaN(parseInt(prevHeight.previousHeight))){
      console.log("Seed not initialized ...")
    
    }
    else{
         
    XeniaBot.getSlashingParams().then(res => {
        let signedWindow = "15"//res.signed_blocks_window;
        
        console.log("previous Height = "+ prevHeight.previousHeight)
        XeniaBot.roulette(prevHeight.previousHeight, signedWindow).then(roulettea =>{
            //console.log(roulettea)
            if(roulettea.state){
                XeniaBot.analyze(roulettea.height, signedWindow).then( x => {
                    XeniaBot.statusMsg("Xenia is Blessing Validators ... (^__^)")
                    x.forEach(element => {
                        XeniaBot.delegate(element).then(res => {
                            //console.log(res)
                            })
                                   
                    });
                    console.log("Autodelegating....!!")   
                });
              
            }    
        
                        
        });
        
    });       
    
    }

}

XeniaBot.greetingMsg(); // Say Hi to the world :)
XeniaBot.init().then(res=>{
    console.log("Xenia Initialized!!")
    setInterval(automata, cyclicTime)//test)

})

