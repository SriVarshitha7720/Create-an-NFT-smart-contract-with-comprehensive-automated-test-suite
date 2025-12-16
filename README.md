# NFT Collection – Hardhat Project

A simple, secure NFT collection smart contract built using Solidity and tested with the Hardhat development environment.
This project emphasizes security, simplicity, and reproducible testing through Docker.

**Project Overview**



This repository contains:

An ERC-721 NFT smart contract

A fully configured Hardhat development environment

A Dockerized setup for consistent builds and test execution

A comprehensive test suite validating security and functionality

# Running the Contract Tests via Docker

Docker ensures a reproducible and isolated environment for compiling and testing the contracts.

 # 1)Build the Docker Image

**Build the Docker image and tag it as nft-contract:**


**Bash**  :-
>> docker build -t nft-contract .

**Build Fix Applied**
The Dockerfile includes the following step to prevent Hardhat compilation errors:


**Bash**   :-
>>RUN rm -f contracts/Counter.t.sol

-> This removes an incompatible Foundry test file.



# 2)Run Tests Inside the Container

**Execute the Hardhat test suite using the in-memory Hardhat network:**

**Bash** :-

>> docker run nft-contract npx hardhat test --network hardhat

Test Fixes Incorporated

-> Replaced Ethers v6 method waitForDeployment() with v5-compatible logic

-> Simplified assertions from:



