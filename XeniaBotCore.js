import 'dotenv/config';
import cosmosjs from '@cosmostation/cosmosjs'

const chainId = process.env.CHAIN_ID;
const lcdAddress = process.env.LCD_ADDRESS;
const walletPath = process.env.HD_WALLET_PATH;
const mnemonic = process.env.MNEMONIC;
const bech32Prefix = process.env.BECH32_PREFIX;
const amount = process.env.AMOUNT;
const denom = process.env.DENOM;
//const hours = parseInt(process.env.HOURS);
//const window = parseInt(process.env.MONTRING_WINDOW);
const memo = process.env.MEMO;
const cosmos = cosmosjs.network(lcdAddress, chainId);

cosmos.setPath(walletPath);
cosmos.setBech32MainPrefix(bech32Prefix);

const address = cosmos.getAddress(mnemonic);
const ecpairPriv = cosmos.getECPairPriv(mnemonic);


const axios = require("axios")
//const bech32 =  require("bech32")
//const getAddress = require('./src/pubkey')


const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
const txHistory = db.get('TxHistory');
const rouletteHistory = db.get('xRoulette');
const eligibleValidatorsPool =  db.get('ValPool');


const chalk = require("chalk");
const boxen = require("boxen");
const figlet = require("figlet");



//function get the latest Validator and height 
const getValidatorInfo = async (height) => {
  let url = lcdAddress+"/validatorsets/"+height;
 let res = await axios.get(url);
 let val = res.data.result.validators
 //console.log(val)
 return val
}  

//fucntion ge the bounded validators list in certain height 
const geteligible = async (blockHeight) => {
   let url = lcdAddress+"/staking/validators?status=bonded&height="+blockHeight;
 let res = await axios.get(url);
 let val = res.data.result
 //console.log(val)
 return val
}

//function latest commet
const getBlockCommit = async (blockHeight) => {
 let url = lcdAddress + "/blocks/"+blockHeight
 let res = await axios.get(url);
 let sig = res.data.block.last_commit.signatures
 //console.log(sig.length)
 //console.log(sig)
 return sig
}

//function to get signiing status for the validators 
 const getSignInfo = async (height) => {
 let url = lcdAddress+"/slashing/signing_infos?height="+height;
 let res = await axios.get(url);
 let dta = res.data
 //console.log(val)
 return dta
}

//function return seed and start height for way back machine ;)
const seed = async () => {
 let url = lcdAddress + "/blocks/latest"
 let res = await axios.get(url);
let seedHeight = res.data.block.header.height
 console.log(res.data.block.header.height)
  return seedHeight
}



//fucntion get slasahing parameters.
const getSlashingParams = async () => {
   let url = lcdAddress + "/slashing/parameters"
   let res = await axios.get(url);
  return(res.data.result)

}

const getMatchingValAddress =async (height) => {
  let addressList = []
  let eligible = await geteligible(height)
  let eligibleAddress = eligible.map(eligableValidator => { return eligableValidator.consensus_pubkey; });
  let valList = await getValidatorInfo(height)
  console.log(eligibleAddress.length)
  console.log(valList.length)
  let val= valList.filter( lv => eligibleAddress.includes(lv.pub_key));
  val.forEach((l)=>{
    let output ={}
    output.address =  l.address;
    output.pub_key =  l.pub_key;
    output.operator_address =  eligible.filter((lv)=>{return lv.consensus_pubkey == l.pub_key})[0].operator_address;
    output.voting_power = l.voting_power 
    addressList.push(output); 
  });
  
  return addressList
}

const greetingMsg = () => {
    const greeting = chalk.yellow.bold("Desmos Autodelegator Bot");

  const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
  backgroundColor: "#555555"
  };
  const msgBox = boxen( greeting, boxenOptions )

  figlet.text("Xenia", {
      font: 'Electronic',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
  }, function(err, data) {
      if (err) {
          console.log('Something went wrong...');
          console.dir(err);
          return;
      }

      console.log(data);
      console.log(msgBox)
  });
}

const stepMsg = (msgTxt) => {
  const status = chalk.green.bold(msgTxt);
  const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "yellow",
  backgroundColor: "#555555"
  };
  const msgBox = boxen( status, boxenOptions )
  console.log(msgBox)

}

const statusMsg = (msgTxt) =>{
  const status = chalk.blue.bold(msgTxt);
  const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
  backgroundColor: "#ffff33"
  };
  const msgBox = boxen( status, boxenOptions )
  console.log(msgBox)

}

const errorMsg = (msgTxt) =>{
  const status = chalk.white.bold(msgTxt);
  const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "yellow",
  backgroundColor: "#ff0000"
  };
  const msgBox = boxen( status, boxenOptions )
  console.log(msgBox)

}




// function analyze signing blocks in certain signing window and calculate the validators performance 
const analyze =  async (latest_height,blocksWindow)=>{
  //let latest_height = await seed()
  statusMsg("Analyzing Validators Performance...")
  let signDta = await getSignInfo(latest_height)
  let eligible = await getMatchingValAddress(latest_height)
  let validtorList = []
  let eligible_ =  eligible.map(eligableValidator => { return eligableValidator.address; });

  let filteredData = signDta.result.filter(dta => eligible_.includes(dta.address));
   
  filteredData.forEach((i)=>{
    let output = {}
    output.val_address = i.address
    output.val_pub_address = eligible.filter((lv)=>{return lv.address == i.address})[0].pub_key
    output.operator_address = eligible.filter((lv)=>{return lv.address == i.address})[0].operator_address
    output.voting_power = eligible.filter((lv)=>{return lv.address == i.address})[0].voting_power
    output.performance = ((blocksWindow-i.missed_blocks_counter)/blocksWindow)*100
    validtorList.push(output)
  });
  
  //console.log(validtorList[0].val_pub_address[0].pub_key)
  let matchedValidators = validtorList.filter((a) => {return (a.performance >= 90) })


  matchedValidators.sort((a,b) => {return a.performance - b.performance})
  
  let mAddress = matchedValidators.map(lValidator => { return lValidator.operator_address; });
      
  console.log("Xenia Bot ... Analysis Completed !!")
  console.log(mAddress.length)
  return mAddress

}

//intiatlize the first height for Xenia
const init = async()=>{
  stepMsg("Initiation of seed and dry run...(*_*)")
  let latestHeight =  await seed();
  let rouletteBlock =  rouletteHistory.value()
  if(rouletteBlock.previousHeight==""){
    db
    .set('xRoulette',{"previousHeight": latestHeight})
    .write()  
  }     
}

//Roulette Function 
const roulette = async (seedHeight,signedWindow) => {
  stepMsg("Monitoring Network's Blocks Heights.. (0_0)")
  let output  = {}
  let latestHeight =  await seed();
  let previousHeight = parseInt(seedHeight); 
  signedWindow = parseInt(signedWindow)
  console.log("latestheight= "+ latestHeight)
  console.log("prevHeight= "+previousHeight)
  console.log("Target Height= "+ (previousHeight+signedWindow))
  if ((previousHeight + signedWindow) < parseInt(latestHeight)) {
      output.state = true;
      output.height = latestHeight
      db
                .set('xRoulette',{"previousHeight": latestHeight})
                .write()
  
  } 
  else {
      output.state = false;
      output.height = previousHeight
  }
return output
}


const getAccountInfo  = async(address) =>{
  let url = lcdAddress + "/auth/accounts/" + address
  let res = await axios.get(url);
  return res.data
}

const broadcastTX = (signedTx, valAddress) => {
  let url  =  lcdAddress + "/txs"
  let option = { headers: {
    'Content-Type': 'application/json'
  }};
  
  axios.post(url, signedTx, option).then( res => {
    let now = Date.now();
          //console.log(response)
          txHistory
              .push({ valAddress: valAddress,amount: amount, txTime: now})
              .write()
          
          
          console.log(valAddress + " delegated with " + amount +" "+denom)
          
  }).catch( err => {
    errorMsg ("TX->ERROR: " + String(err) )
  })


} 

const  convertStringToBytes = (str) => {
	if (typeof str !== "string") {
	    throw new Error("str expects a string")
	}
	var myBuffer = [];
	var buffer = new Buffer(str, 'utf8');
	for (var i = 0; i < buffer.length; i++) {
	    myBuffer.push(buffer[i]);
	}
	return myBuffer;
}

function sortObject(obj) {
	if (obj === null) return null;
	if (typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(sortObject);
	const sortedKeys = Object.keys(obj).sort();
	const result = {};
	sortedKeys.forEach(key => {
		result[key] = sortObject(obj[key])
	});
	return result;
}

const DelgMsg = (valAddresses, account_number, sequence) => {
  let allMsgs =  []
    valAddresses.forEach((i) => {
      let formateMsg = {}
      formateMsg.type =  "cosmos-sdk/MsgDelegate", 
      formateMsg.value = {
            amount: {
              amount: String(amount),
              denom: denom
            },
            delegator_address: address,
            validator_address: i
          }
      allMsgs.push(formateMsg)
    });
    const stdSignMsg = new Object;
    let gases =  allMsgs.length * 200000
    let fees= Math.ceil(gases * 0.025)
    stdSignMsg.json = 
    {
        account_number: String(account_number),
      chain_id: chainId,
      fee: { 
        amount: [ 
          { 
            amount: String(fees), 
            denom: denom
          } 
        ], 
        gas: String(gases) 
      },
      memo: memo,
      msgs: allMsgs,
      sequence: String(sequence) 
    }
  
    stdSignMsg.bytes = convertStringToBytes(JSON.stringify(sortObject(stdSignMsg.json)));
  
    return stdSignMsg;
  }

 
  
//Function handle the delegation transaction
const delegate = (valAddress) =>{
  //cosmos.getAccounts
  try{
    getAccountInfo(address).then(data => {
      //console.log(data.result)
        let stdSignMsg = DelgMsg(valAddress, data.result.value.account_number , data.result.value.sequence)
         
         console.log(stdSignMsg)  

        const signedTx = cosmos.sign(stdSignMsg, ecpairPriv);
         
        console.log(signedTx)
        //cosmos.broadcast
        broadcastTX(signedTx, valAddress)
        
    })
    //return "AutoDelegation Done !!"
    
  }
  catch(err){

    
      errorMsg ("Account Info -> ERROR: " + err )
    

  }
 
}   



module.exports ={analyze, delegate,roulette,greetingMsg,getSlashingParams,init,statusMsg,rouletteHistory, eligibleValidatorsPool, db}