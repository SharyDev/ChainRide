const ChainRideContract = artifacts.require("ChainRideContract");

contract("ChainRideContract", (accounts) => {
  let contract;

  beforeEach(async () => {
    // Deploy a new instance of the contract before each test
    contract = await ChainRideContract.new();
  });

  it("should record a trip", async () => {
    const price = web3.utils.toWei("1", "ether"); 
    const distance = 10;
    const initialLongitude = 12345;
    const initialLatitude = 54321;
    const finalLongitude = 12356;
    const finalLatitude = 54322;
    const clientMetaAccount = accounts[0];
    const driverMetaAccount = accounts[1];

    // Record the trip
    await contract.recordTrip(
      price,
      distance,
      initialLongitude,
      initialLatitude,
      finalLongitude,
      finalLatitude,
      clientMetaAccount,
      driverMetaAccount
    );

    // Fetch the trip data from the contract
    const trip = await contract.trips(clientMetaAccount);

    // Check the values recorded in the trip
    assert.equal(trip.price.toString(), price, "Price is incorrect");
    assert.equal(trip.distance.toString(), distance.toString(), "Distance is incorrect");
    assert.equal(trip.initialLongitude.toString(), initialLongitude.toString(), "Initial Longitude is incorrect");
    assert.equal(trip.initialLatitude.toString(), initialLatitude.toString(), "Initial Latitude is incorrect");
    assert.equal(trip.finalLongitude.toString(), finalLongitude.toString(), "Final Longitude is incorrect");
    assert.equal(trip.finalLatitude.toString(), finalLatitude.toString(), "Final Latitude is incorrect");
    assert.equal(trip.clientMetaAccount, clientMetaAccount, "Client Account is incorrect");
    assert.equal(trip.driverMetaAccount, driverMetaAccount, "Driver Account is incorrect");
  });
});