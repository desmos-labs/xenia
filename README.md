# Desmos Xenia

Xenia is a delegator bot for the desmos network. introducing gamification concept to reward based on stacking performance. validators will be rewarded based on their performance for a period of time. 
The bot will induce change in the democracy of voting and proposing as it will offer opportunities for the other to propose based on their performance and hence their voting power which will be increased after multiple delegations.
The bot will monitor the performance of validators across 1000 blocks. The validators who will contribute with 80% precommits will be delegated xxxx udriac. 
if a day passes and stays with the same performance, no more delegation. 
The bot will begin with lower voting power then alternate on the other based on cyclic run every single day.


Rename `.env.sample` to `.env` and update the faucet wallet mnemonic phrase.

``` sh
npm install --save
npm dev
```

if you need to check eligability or your operator address has been elected for autodelegation you can 

 post an address to `http://localhost:1337/xenius` endpoint.

``` sh
curl -X POST -H "Content-Type:application/json" http://localhost:1337/xenius -d '{"address":"desmos1tws35nang4va8edrxl35xpr3lpmqxwg2gk7fp4"}'
```
