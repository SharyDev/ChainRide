const ChainRideContract = artifacts.require("ChainRideContract");

module.exports = async function (deployer) {
    console.log("Deploying ChainRideContract...");
    await deployer.deploy(ChainRideContract);
    console.log("ChainRideContract deployed successfully.");
  };