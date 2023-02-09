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

Get the API key from https://etherscan.io/ and set the key ETHERSCAN_API_KEY in the .env file.<br />
Get the API key from https://polygonscan.com/ and set the key POLYGONSCAN_API_KEY in the .env file.

## Usage

index [Options] address

<pre>
Options:
  -V, --version           output the version number
  -n, --network <network> network (default: "mainnet")
  -c, --chain <chain>     chain [ethereum | polygon] (default: "ethereum")
  -h, --help              display help for command
</pre>

## Example

```
node index --network mainnet 0x845a007d9f283614f403a24e3eb3455f720559ca 
```

```
node index --chain polygon 0x3b1bde5f275d7a150fb7c8e2a35de394ef8ab52f
```

## Note

The file will be downloaded under the sources directory.
