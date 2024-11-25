// SPDX-License-Identifier: MIT
pragma solidity ^0.4.26;

contract ChainRideContract {
    struct Trip {
        uint256 price;
        uint256 distance;
        int256 initialLongitude;
        int256 initialLatitude;
        int256 finalLongitude;
        int256 finalLatitude;
        address clientMetaAccount;
        address driverMetaAccount;
    }

    // A mapping to store trips, indexed by the client's Ethereum address (clientMetaAccount)
    mapping(address => Trip) public trips;

    event TripRecorded(
        address indexed clientMetaAccount,
        uint256 price,
        uint256 distance,
        int256 initialLongitude,
        int256 initialLatitude,
        int256 finalLongitude,
        int256 finalLatitude,
        address driverMetaAccount
    );

    // Function to record a new trip
    function recordTrip(
        uint256 price,
        uint256 distance,
        int256 initialLongitude,
        int256 initialLatitude,
        int256 finalLongitude,
        int256 finalLatitude,
        address clientMetaAccount,
        address driverMetaAccount
    ) public {
        // Check that the addresses are not zero
        require(clientMetaAccount != address(0), "Invalid client address");
        require(driverMetaAccount != address(0), "Invalid driver address");

        // Create a new Trip struct and store it using the client's address as the key
        trips[clientMetaAccount] = Trip({
            price: price,
            distance: distance,
            initialLongitude: initialLongitude,
            initialLatitude: initialLatitude,
            finalLongitude: finalLongitude,
            finalLatitude: finalLatitude,
            clientMetaAccount: clientMetaAccount,
            driverMetaAccount: driverMetaAccount
        });

        emit TripRecorded(
            clientMetaAccount,
            price,
            distance,
            initialLongitude,
            initialLatitude,
            finalLongitude,
            finalLatitude,
            driverMetaAccount
        );
    }

    // Function to get trip details by clientMetaAccount (used instead of tripId)
    function getTrip(
        address clientMetaAccount
    )
        public
        view
        returns (
            uint256,
            uint256,
            int256,
            int256,
            int256,
            int256,
            address,
            address
        )
    {
        Trip memory t = trips[clientMetaAccount];
        return (
            t.price,
            t.distance,
            t.initialLongitude,
            t.initialLatitude,
            t.finalLongitude,
            t.finalLatitude,
            t.clientMetaAccount,
            t.driverMetaAccount
        );
    }
}
