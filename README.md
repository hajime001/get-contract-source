# Get Contract Source

## Summary

A tool to download source code using etherscanApi, created for viewing in IDE.

## Requirement

```
node.js
```
## Installation

```
npm install
cp .env.sample .env
```

Get the API key from https://etherscan.io/ and set the key EHTERSCAN_API_KEY in the .env file.

## Usage

index [options] address

## Example

```
node index --network mainnet 0x2e7b8beE6E94b62B3B5f29BcdA00BE618a27f459 
```

## Note

The file will be downloaded under the sources directory.

## Issue

This tool downloads maintaining the hierarchy, but perhaps the path is misaligned if you are using npm.
