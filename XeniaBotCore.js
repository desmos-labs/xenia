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


//function get the latest Validator and height 
const getValdiatorInfo = async (blockHeight) => {
    let url = lcdAddress+"/validatorsets/"+blockHeight;
  let res = await axios.get(url);
  let val = res.data.result.validators
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
  const getSignInfo = async () => {
  let url = lcdAddress+"/slashing/signing_infos";
  let res = await axios.get(url);
  let dta = res.data
  //console.log(val)
  return dta
 }
 
 //fucntion get slasahing parameters.
const getSlashingParams = async () => {
    let url = lcdAddress + "/slashing/parameters"
    let res = await axios.get(url);
   return(res.data.result)
 
 } 
 
 // function analyze the blocks backward and calculate the validators performance 
const analyze =  async ()=>{
  
    let signDta = await getSignInfo()
    let validtorList = []
    let blocksWindow = await getSlashingParams()
    signDta.result.forEach((i)=>{
      let output = {}
      output.val_address = i.address
      output.performance = ((blocksWindow.signed_blocks_window-i.missed_blocks_counter)/blocksWindow.signed_blocks_window)*100
      validtorList.push(output)
    });
    
    
  let matchedValidators = validtorList.filter((a) => {return (a.performance >= 90) })
  
  
  matchedValidators.sort((a,b) => {return a.performance - b.performance})
   
   //matchedValidators = matchedValidators.reduce(function (p, v) {
   //   return ( p.performance < v.performance ? p : v);
    //});
    let mAddress = matchedValidators.map(lValidator => { return lValidator.val_address; });
    
    console.log("Xenia Bot ... Analysis Completed !!")

    return mAddress
   
  }
 
 


//Function handle the delegation transaction
const delegate = async(ValAddress) =>{

    cosmos.getAccounts(address).then(data => {
        let stdSignMsg = cosmos.NewStdMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: address,
            to_address: ValAddress,
            amountDenom: denom,
            amount: amount,
            feeDenom: denom,
            fee: 0,
            gas: 200000,
            memo: memo,
            account_number: data.result.value.account_number,
            sequence: data.result.value.sequence
        });

        const signedTx = cosmos.sign(stdSignMsg, ecpairPriv);
        cosmos.broadcast(signedTx).then(response => {
            let now = Date.now();
            
            txHistory
                .push({ valAdress: ValAddress,amount: amount, txTime: now})
                .write()
            
            //res.send(response)
            console.log(ValAddress + "delegated with " + amount + "denom")
           
        });
    })
 return "AutoDelegation Done !!"
}   



module.exports ={analyze, delegate}