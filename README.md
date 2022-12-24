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

Get the API key from https://etherscan.io/ and set the key ETHERSCAN_API_KEY in the .env file.

## Usage

index [Options] address

<pre>
Options:
  -V, --version          output the version number
  -n, --network <chain>  chain (default: "mainnet")
  -h, --help             display help for command
</pre>

## Example

```
node index --network mainnet 0x845a007d9f283614f403a24e3eb3455f720559ca 
```

## Note

The file will be downloaded under the sources directory.
