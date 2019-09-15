const Eth = require('./template/ethjs');
const web3 = require('./template/web3');

const $ = require('jquery');
const Vue = require('vue');
// const Popper = require('./template/popper');


// const bootstrap = require('./template/bootstrap.min');
const main = require('./template/main');



const mineable_token = require('./template/mineable-token-vue.js');

// import Fundraiser from './template/fundraiser'

//import TokenStats from './template/tokenStats'


// let fundraiser = new Fundraiser(Eth);
//let tokenStats = new TokenStats();
import {
    bro
} from './template/bro';


$(document).ready(function () {
    console.log("DOMready");

    console.log(bro('iM THE SHUFFLE MONSTER'))
    //   fundraiser.init()



    //  tokenStats.init();

});