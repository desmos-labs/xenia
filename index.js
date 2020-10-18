import bodyParser from 'body-parser';
import { Console } from 'console';

import { reset } from 'nodemon';

import 'dotenv/config';

const denom = process.env.DENOM;
const chainId = process.env.CHAIN_ID;

const compression = require('compression');
const helmet = require('helmet');

const XeniaBot = require("./XeniaBotCore.js")

const express = require('express')
const app = express()
const port = 1337

//const checkInterval = hours * 60 * 60 * 1000 // change it to the blocak analysis check time 2hrs
//const cyclicTime = hours * 60 * 60 * 1000 // cyclic time to elect active valdito to delegate 


const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
const activeList = db.get('activeValidator');
const turnRoulette = db.get('Roulette');
// db.defaults({ history: [] })
//   .write()
  
app.use(compression());
app.use(helmet());

app.set('view engine', 'pug')

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.render('index', {
        chainId: chainId,
        denom: denom
    });
});

app.post('/xenius', (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
// check the operator address if it has been delegated and if eligable for autodelegation or not   
            res.send({message: 'This Operator have been blessed by Xenia'});
        
        
    });

 //handle the bot autonmous    
    app.get('/automata', function (req, res) {
        // return with the bot status 
        XeniaBot.analyze().then( x => {
            x.forEach(element => {
                XeniaBot.delegate(element).then(res => {
                    console.log(res)
                })
            });
        })
    });

  // handle the cyclic rounds for delegation each day    
    app.get('/roulette', function (req, res) {
          
    });
   
    
  


   


app.listen(port, () => console.log(`Xenia Connected on... ${port}!`))
