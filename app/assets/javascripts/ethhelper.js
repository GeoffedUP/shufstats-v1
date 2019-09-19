var INFURA_ROPSTEN_URL =
  "https://ropsten.infura.io/v3/9b0e87a7c6be4d1880bac7facf80a175";
var INFURA_MAINNET_URL =
  "https://mainnet.infura.io/v3/9b0e87a7c6be4d1880bac7facf80a175";

const Eth = require("ethjs");
const eth = new Eth(new Eth.HttpProvider(INFURA_MAINNET_URL));

var deployedContractInfo = require("../contracts/DistributedStorage.json");
var ShuffleToken = require("../contracts/ShuffleToken.json");

var embeddedWeb3 = require("web3");

var web3utils = require("web3-utils");

export default class EthHelper {
  init(alertRenderer) {
    this.alertRenderer = alertRenderer;

    return this.connectWeb3(new embeddedWeb3());
  }

  connectWeb3(web3) {
    window.web3 = new Web3(new Web3.providers.HttpProvider(INFURA_MAINNET_URL));
    console.log("connected to web3!");
    return window.web3;
  }

  async connectToContract(web3, callback) {
    var tokenContract = this.getWeb3ContractInstance(
      web3,
      this.getContractAddress(),
      this.getContractABI()
    );

    console.log("contract", tokenContract);

    var contractAddress = this.getContractAddress();

    var name = await tokenContract.name();

    var symbol = await tokenContract.symbol();

    var decimals = await tokenContract.decimals.toNumber();

    var circulatingSupply = await tokenContract.totalSupply();

    var latestWinner = await tokenContract.Winner.toNumber();

    var decimals = Math.pow(10, 8);
    var renderData = {
      contractUrl: "https://etherscan.io/address/" + contractAddress,
      contractAddress: contractAddress,
      totalSupply: parseInt(totalSupply) / decimals
    };

    callback(renderData);
  }

  async getSearchResults(web3, query, callback) {
    var self = this;

    var results = [];

    console.log("getting search results");

    if (Number.isNaN(query)) {
      callback(results);
      return;
    }

    if (web3utils.isAddress(query)) {
      var accountData = await self.getAccountData(web3, query);
      console.log("accountData", accountData);
    }

    var tx = await new Promise(function(fulfilled, error) {
      web3.eth.getTransaction(query, function(err, result) {
        fulfilled(result);
      });
    });

    console.log("tx", tx);

    if (accountData != null) {
      results.push({
        type: "account",
        address: accountData.address,
        url: "/account.html?address=" + accountData.address,
        data: accountData
      });
    }

    if (tx != null) {
      results.push({
        type: "tx",
        address: tx.hash,
        url: "/transaction.html?hash=" + tx.hash,
        data: tx
      });
    }

    callback(results);
  }

  async getAccountData(web3, address) {
    var tokenContract = this.getWeb3ContractInstance(
      web3,
      this.getContractAddress(),
      this.getContractABI()
    );

    var tokenBalance = await new Promise(function(fulfilled, error) {
      tokenContract.balanceOf.call(address, function(err, result) {
        fulfilled(result);
      });
    });

    var etherBalance = await new Promise(function(fulfilled, error) {
      web3.eth.getBalance(address, function(err, result) {
        fulfilled(result);
      });
    });

    return {
      address: address,
      tokenBalance: tokenBalance.toNumber(),
      etherBalance: etherBalance.toNumber()
    };
  }

  async getTransactionData(web3, hash) {
    var tx = await new Promise(function(fulfilled, error) {
      web3.eth.getTransaction(hash, function(err, result) {
        fulfilled(result);
      });
    });

    var txType = null;

    if (tx.input.substring(0, 10) == "0xa9059cbb") {
      txType = "transfer";
      tx.transferAmountRaw = tx.input.substring(tx.input.length - 64);
      tx.transferAmount = parseInt(tx.transferAmountRaw, 16) / 10e7;

      tx.transferTo = "0x" + tx.input.substring(34, 74);
      tx.transferToUrl = "/account.html?address=" + tx.transferTo;
    }

    if (tx.input.substring(0, 10) == "0x095ea7b3") {
      txType = "approve";
      tx.transferAmountRaw = tx.input.substring(tx.input.length - 64);
      tx.transferAmount = parseInt(tx.transferAmountRaw, 16) / 10e7;
    }

    if (tx.input.substring(0, 10) == "0x1801fbe5")
      tx.fromUrl = "/account.html?address=" + tx.from;
    tx.toUrl = "/account.html?address=" + tx.to;

    tx.etherscanUrl = "https://etherscan.io/tx/" + tx.hash;

    tx.txType = txType;

    return tx;
  }

  // estimateHashrateFromDifficulty(difficulty){

  // var timeToSolveABlock =  10*60;  //seconds.. ten minutes

  // var hashrate = web3utils.toBN(difficulty)
  // .mul( web3utils.toBN(2)
  // .pow(  web3utils.toBN(22) ))
  // .div( web3utils.toBN(timeToSolveABlock ))

  // var gigHashes = hashrate / ( parseFloat( web3utils.toBN(10).pow( web3utils.toBN(9) )) )

  // console.log('hashrate is ',hashrate )
  // return gigHashes.toFixed(2).toString() + " GH/s"

  // }

  async getEventList(web3, type) {
    var tokenContract = this.getWeb3ContractInstance(
      web3,
      this.getContractAddress(),
      this.getContractABI()
    );

    var current_block = await this.getCurrentEthBlockNumber(web3);

    var winner_topic =
      "0x9c2270628a9b29d30ae96b6c4c14ed646ee134febdce38a5b77f2bde9cea2e20";
    var leaveheap_topic =
      "0x61072af1539e7159a567565ab0a7863c5ad61aa8daa91cf3843c3bb8bccb00e7";
    var joinheap_topic =
      "0xb7c8eb45e695579273671351c1ee88509af6ec27e061176b10f5f9fb145eff93";

    var logTypeTopic = null;

    if (type == "winner") {
      logTypeTopic = winner_topic;
    }
    if (type == "leaveheap") {
      logTypeTopic = leaveheap_topic;
    }

    if (type == "joinheap") {
      logTypeTopic = joinheap_topic;
    }

    var list = await new Promise(function(fulfilled, error) {
      eth
        .getLogs({
          fromBlock: current_block - 10000,
          toBlock: current_block,
          address: "0x3a9fff453d50d4ac52a6890647b823379ba36b9e",
          topics: [logTypeTopic, null]
        })
        .then(result => {
          fulfilled(result);
        });
    });

    return list;
  }

  async getCurrentEthBlockNumber(web3) {
    var ethBlockNumber = await new Promise(function(fulfilled, error) {
      web3.eth.getBlockNumber(function(err, result) {
        if (err) {
          error(err);
          return;
        }
        console.log("eth block number ", result);
        fulfilled(result);
        return;
      });
    });
    return ethBlockNumber;
  }

  getWeb3ContractInstance(web3, contract_address, contract_abi) {
    if (contract_address == null) {
      contract_address = this.getContractAddress();
    }

    if (contract_abi == null) {
      contract_abi = this.getContractABI();
    }

    return web3.eth.contract(contract_abi).at(contract_address);
  }

  getContractAddress() {
    return deployedContractInfo.networks.mainnet.contracts.ShuffleToken
      .blockchain_address;
  }

  getContractABI() {
    return ShuffleToken.abi;
  }
}
