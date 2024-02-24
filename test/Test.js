const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ethazon Contract", function () {
  
  let contract; 
  let owner; // contract
  let customer; // customer
  const PRICE = 10;


  beforeEach(async function () {
    [owner, customer] = await ethers.getSigners(); // Get Signers
    const TestContract = await ethers.getContractFactory("Ethazon");
    contract = await TestContract.deploy(); 

  });

  it("A customer cannot make the order if either the customerName or shippingAddress is empty.", async function () {
    // Get output from functions
    await expect(contract.connect(customer).placeOrder("Alex", "",{value: PRICE}))
            .to.be.revertedWith("Customer name and shipping address must be provided");
  });

  it("A customer cannot confirm if the order is not valid", async function () {
    // directly call comfirmOrder to simulate this situatuin
    await expect(contract.connect(customer).confirmOrder())
        .to.be.revertedWith("Order does not exist or has already been confirmed");
  });

  it("A customer cannot cancel the order if the customer has confirmed the order", async function () {
    // customer places an order
    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});
    
    // customer confirms the order
    await contract.connect(customer).confirmOrder();

    // customer tries to cancel the confirmed order, expecting it to fail
    await expect(contract.connect(customer).cancelOrder())
      .to.be.revertedWith("Order does not exist or has already been confirmed");
  });

  it("A customer cannot make another order before she/he has confirmed or canceled the existing order", async function () {
    // customer places the first order
    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});
    
    // customer tries to place a second order before confirming or cancelling the first one
    await expect(contract.connect(customer).placeOrder("Alex", "456 Another St", {value: PRICE}))
      .to.be.revertedWith("Existing active order must be confirmed or cancelled");
  });

  it("A customer cannot make an order if he/she does not send enough ether to the smart contract", async function () {
  // Get output from functions
    await expect(contract.connect(customer).placeOrder("Alex", "123 Main St", {value: 1}))
          .to.be.revertedWith("Incorrect Payment");
  });

  it("If everything is OK, a customer should create an order successfully", async function () {
    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});

    const order = await contract.orderPair(customer.address);

    expect(order.isValidEthazonOrder).to.be.true;
    expect(order.customerName).to.equal("Alex");
    expect(order.shippingAddress).to.equal("123 Main St");
    expect(order.hasConfirmed).to.be.false;
  });

  it("A customer should receive the money when she/he cancels the order successfully", async function () {
    // const a = await ethers.provider.getBalance(customer.address);
    // console.log(a);

    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});
    await contract.connect(customer).cancelOrder();

    const b = await contract.connect(customer).getBalance();
    expect(b).to.equal(0);
  });


  it("A customer can confirm the order if everything is good", async function () {
    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});
    await contract.connect(customer).confirmOrder();
  
    const order = await contract.orderPair(customer.address);
  
    expect(order.isValidEthazonOrder).to.be.true;
    expect(order.customerName).to.equal("Alex");
    expect(order.shippingAddress).to.equal("123 Main St");
    expect(order.hasConfirmed).to.be.true;  

  }); 

  it("The smart contract should have the correct balance of Ethers if an order has been made", async function () {
    await contract.connect(customer).placeOrder("Alex", "123 Main St", {value: PRICE});
    await contract.connect(customer).confirmOrder();

    const balance = await contract.connect(customer).getBalance();
    expect(balance).to.equal(10);
  });


});



