import 'dotenv/config';
import cosmosjs from '@cosmostation/cosmosjs'

const chainId = process.env.CHAIN_ID;
const lcdAddress = process.env.LCD_ADDRESS;
const walletPath = process.env.HD_WALLET_PATH;
const mnemonic = process.env.MNEMONIC;
const bech32Prefix = process.env.BECH32_PREFIX;
const amount = process.env.AMOUNT;
const denom = process.env.DENOM;
const hours = parseInt(process.env.HOURS);
const window = parseInt(process.env.MONTRING_WINDOW);
const memo = process.env.MEMO;
const cosmos = cosmosjs.network(lcdAddress, chainId);

cosmos.setPath(walletPath);
cosmos.setBech32MainPrefix(bech32Prefix);

const address = cosmos.getAddress(mnemonic);
const ecpairPriv = cosmos.getECPairPriv(mnemonic);


const axios = require("axios")
const bech32 =  require("bech32")
const getAddress = require('./src/pubkey')


const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
const txHistory = db.get('TxHistory');


//function get the latest Validator and height 
const getValdiator = async () => {
   let url = lcdAddress+"/validatorsets/latest";
 let res = await axios.get(url);
 let val = res.data.result.validators
 console.log(val)
 return val
}

//function latest commet
const getBlockCommit = async (blockHeight) => {
 let url = lcdAddress + "/blocks/"+blockHeight
 let res = await axios.get(url);
 let sig = res.data.block.last_commit.signatures
 //console.log(sig.length)
 console.log("get last Commit on block height " + blockHeight)
 return sig
}

//seed function get seed block height to begin the analysis 
const seed  =  async() => {
    let url = lcdAddress + "/blocks/latest"
    let res = await axios.get(url);
    let seedHeight = res.data.block.header.height
    console.log("seeding: " + seedHeight) 
    return seedHeight 
}

//Analysis Function which monitor 1000 block to extract vlaidator performance  
const analyze = async (blockHeight) => {
    let windowSpan = window
    let span = blockHeight 
    let collector = []
    while(span >= blockHeight-windowSpan){
       await getBlockCommit(span).then(sigArrs => {
           Array.prototype.push.apply(collector, 
            sigArrs.map(sigArr => {return sigArr.validator_address}))
       })
        span--;
    }

 return collector 
}   


//Crypto function bechtopubkey
const  pubkeyToBech32 = (pubkey, prefix)=>{
  let buffer;

        if (pubkey.type.indexOf("PubKeyEd25519") > 0){
            // '1624DE6420' is ed25519 pubkey prefix
            let pubkeyAminoPrefix = Buffer.from('1624DE6420', 'hex');
            buffer = Buffer.alloc(37);
        
            pubkeyAminoPrefix.copy(buffer, 0)
            Buffer.from(pubkey.value, 'base64').copy(buffer, pubkeyAminoPrefix.length)
        }
        else if (pubkey.type.indexOf("PubKeySecp256k1") > 0){
            // 'EB5AE98721' is secp256k1 pubkey prefix
            let pubkeyAminoPrefix = Buffer.from('EB5AE98721', 'hex');
            buffer = Buffer.alloc(38);
    
            pubkeyAminoPrefix.copy(buffer, 0)
            Buffer.from(pubkey.value, 'base64').copy(buffer, pubkeyAminoPrefix.length)
        }
        else {
            console.log("Pubkey type not supported.");
            return false;
        }

        return bech32.encode(prefix, bech32.toWords(buffer))

} 

//Crypto function pubkeytobech
const  bech32ToPubkey = (pubkey, type) => {
        // type can only be either 'tendermint/PubKeySecp256k1' or 'tendermint/PubKeyEd25519'
        let pubkeyAminoPrefix, buffer;

        if (type.indexOf("PubKeyEd25519") > 0){
            // '1624DE6420' is ed25519 pubkey prefix
            pubkeyAminoPrefix = Buffer.from('1624DE6420', 'hex')
            buffer = Buffer.from(bech32.fromWords(bech32.decode(pubkey).words));
        }
        else if (type.indexOf("PubKeySecp256k1") > 0){
            // 'EB5AE98721' is secp256k1 pubkey prefix
            pubkeyAminoPrefix = Buffer.from('EB5AE98721', 'hex')
            buffer = Buffer.from(bech32.fromWords(bech32.decode(pubkey).words));
        }
        else {
            console.log("Pubkey type not supported.");
            return false;
        }
        
        return buffer.slice(pubkeyAminoPrefix.length).toString('base64');
    }

//*********************************************************************************************************** */

//fucntion to assign default values if not existed in .env

function GetRulesLimit(envVaraible, defaultvalue)
{
    var value =  parseInt(process.env[envVaraible]);
    if(value!=undefined)
        return value;
    else
        return defaultvalue;
}

//****************************************************************************

//fuction check if the address has a validator with voting power higher than defined retriction rule 
const gValidator = async(desmosAddress) => {
    let url1 = lcdAddress+"/validatorsets/latest";
    let url2= lcdAddress+'/staking/delegators/'+desmosAddress+'/validators';
    let votingPowerLimit = GetRulesLimit("VOTING_POWER_LIMIT", 200);
    let flagmV = false;
   await  axios.all([
        axios.get(url1),
        axios.get(url2), 
      // axios.get(url3),
    ]).then(axios.spread((response1, response2) => {
        let validatorsList = response1.data.result.validators;
        let assocValidators = response2.data.result; 
                        console.log("checking associated validator to the delegator address....")
                        //console.log(assocValidators)      
                        let assocValidatorsAddress = assocValidators.map(assocValidator => { return assocValidator.consensus_pubkey; });
                        //console.log("Cross-linked Validators:....")
                        //console.log(assocValidatorsAddress)
                        let matchedValidators = validatorsList.filter(lv => assocValidatorsAddress.includes(lv.pub_key));
                        //console.log("Matched ones....")
                        //console.log(matchedValidators)
                        if(Array.isArray(matchedValidators) && matchedValidators.length){
                        
                            matchedValidators.forEach( (mValidator,i) => {
                                matchedValidators[i].voting_power = parseInt(matchedValidators[i].voting_power);
                               // console.log("stacking power: "+ matchedValidators[i].voting_power);
                              
                                if(matchedValidators[i].voting_power > votingPowerLimit){ 
                                    flagmV = true; 
                                }
                            }); 
                        }
                        else{
                            console.log("the address not associated to validator or the validtor is jailed")
                            flagmV = false;
                        }
    }));
    console.log("is it greedy validator :  " +flagmV)
  return flagmV;
}

//function to check address's balance satisfy rules limits 

const gAddress = async (desmosAddress) => {
    let url3 = lcdAddress + '/bank/balances/'+desmosAddress;
    let res = await axios.get(url3);
    let amountLimit = GetRulesLimit("AMOUNT_LIMIT", 10000000);
    let flagmA = false;
    let  balances = res.data.result;
                        
                        console.log("checking the balances with ....")
                       // console.log(balances);
    
                        balances.forEach((balance, i) => {
                        if (balances[i] && balances[i].amount)
                            balances[i].amount = parseFloat(balances[i].amount);
                         //   console.log("the amount: "+ balances[i].amount)
                            if(balances[i].amount > amountLimit){
                                flagmA = true; 
                            }    
                        }); 
                        console.log("is it greedy address :  "+ flagmA)
    return flagmA



}

// function that handle rules and restruction and check the validaity of the request for given desmos address 

const rulesChecked  = async (ip, desmosAddress) => {
    ip = ip.split(",").map(item => item.trim());
    ip = ip[0];
    let existingIP = historyStore
        .find({ ip: ip })
        .value()
    let isGValidator  = await gValidator(desmosAddress);
    let isGAddress = await gAddress(desmosAddress);

    if (((typeof existingIP == "undefined") || (Date.now()-existingIP.airdropTime >= airdropInterval)) && (isGValidator ==  false)  && (isGAddress == false)){
        console.log("Address is permitted for faucet.....");
        return true;
    }
    else{
        console.log("Address is rejected for fund.......");
        return false;
    }
}



//Function handle the delegation transaction
const delegate = async(ValAddress) =>{

    cosmos.getAccounts(address).then(data => {
        let stdSignMsg = cosmos.NewStdMsg({
            type: "cosmos-sdk/MsgSend",
            from_address: address,
            to_address: req.body.address,
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
                .push({ valAdress: ValAddress,amount: mount, txTime: now})
                .write()
            
            //res.send(response)
            console.log(ValAddress + "delegated with " + amount + "denom")
        });
    })
}   



module.exports ={delegate}