// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ethazon {
    uint public constant PRICE = 10 wei;

    struct EthazonOrder {
	    bool isValidEthazonOrder;
        string customerName;
        string shippingAddress;
	    bool hasConfirmed;
    } 

    event OrderPlaced(address indexed customer, string name, string shippingAddress);
    event OrderCanceled(address indexed customer);
    event RefundIssued(address indexed customer, uint amount);
    event OrderConfirmed(address indexed customer);


    mapping(address => EthazonOrder) public orderPair;

    //Modifier to check if the order can be placed
    modifier canPlaceOrder (address customer){
      require(
        !orderPair[customer].isValidEthazonOrder || orderPair[customer].hasConfirmed,
        "Existing active order must be confirmed or cancelled"
      );
      _; 
    }

    // Modifier to check if the order can be cancelled or Confirmed
    modifier canCancelorConfirmOrder (address customer){
        require(
            orderPair[customer].isValidEthazonOrder && !orderPair[customer].hasConfirmed,
            "Order does not exist or has already been confirmed"
        );
        _;
    }



    function placeOrder (string memory customerName, string memory shippingAddress) public payable canPlaceOrder (msg.sender){
        require (
            msg.value == PRICE,
            "Incorrect Payment"
        );

        require(bytes(
            customerName).length > 0 && bytes(shippingAddress).length > 0, 
            "Customer name and shipping address must be provided"
        );

        EthazonOrder memory a = EthazonOrder(true,customerName,shippingAddress,false);
        orderPair[msg.sender] = a;


        emit OrderPlaced(msg.sender, customerName, shippingAddress);

    }

    function cancelOrder() public canCancelorConfirmOrder(msg.sender) {
    orderPair[msg.sender].isValidEthazonOrder = false;
    emit OrderCanceled(msg.sender);

    // Safely sending Ether back to the customer
    (bool sent,) = msg.sender.call{value: PRICE}("");
    require(sent, "Failed to send Ether");
    emit RefundIssued(msg.sender, PRICE); // Note the event name change for consistency
}


    function confirmOrder () public payable canCancelorConfirmOrder (msg.sender){
        orderPair[msg.sender].hasConfirmed = true;
        emit OrderConfirmed(msg.sender);

    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}

