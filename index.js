

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
const getRound = () => {
   let list = XeniaBot.eligibleValidatorsPool.value(); 
    
    if (list === undefined || list.length == 0) {
        // array empty or does not exist
        console.log("no List identified ")
    }
    else{
        XeniaBot.delegate(list.shift());
        XeniaBot.db.set('ValPool', list).write()


    }
    
}




 //handle the bot autonmous    
 const automata = ()=> {
    let prevHeight =  XeniaBot.rouletteHistory.value()
    if(isNaN(parseInt(prevHeight.previousHeight))){
      console.log("Seed not initialized ...")
    
    }
    else{
         
    XeniaBot.getSlashingParams().then(res => {
        let signedWindow = res.params.signed_blocks_window; //"15"
        
        console.log("previous Height = "+ prevHeight.previousHeight)
        XeniaBot.roulette(prevHeight.previousHeight, signedWindow).then(roulettea =>{
            //console.log(roulettea)
            if(roulettea.state){
                XeniaBot.analyze(roulettea.height, signedWindow).then( x => {
                    XeniaBot.statusMsg("Xenia is Blessing Validators ... (^__^)")
                    
                    //x.forEach(element => {
                     //XeniaBot.db.set('ValPool', x).write()
                     //setInterval(getRound, 2000)
                      //  setTimeout(function(){
                            XeniaBot.delegate(x)
                        //    console.log("wait for Sever Response .......!!")                   
                       //}, 10000) 
                        
                   // });
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

