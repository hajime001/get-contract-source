require('dotenv').config();
require('commander')
    .version('0.0.5')
    .usage('[options] address')
    .option('-n, --network <network>', 'network', 'mainnet')
    .option('-c, --chain <chain>', 'chain', 'ethereum')
    .argument('<address>')
    .action((address, options) => {
        main(address, options);
    }).parse(process.argv);

function main(address, options) {
    const ethers = require('ethers');
    const fs = require('fs');
    const TIMEOUT_MSEC = 3000;
    const SOURCE_DIR = 'sources/' + options.chain;

    if (!isValidAddress(address)) {
        console.log('invalid address: ' + address);
        return;
    }

    const promise = getApiResult(options.chain, options.network, address);
    if (promise === null) {
        console.log('sourcecode get failed.');
        return;
    }

    promise.then((result) => {
        if (result === null || result.SourceCode === '') {
            console.log('source code not found');
            return;
        }
        const contractName = result.ContractName;
        let sources = {};
        if (isOnce(result.SourceCode)) {
            sources[contractName + '.sol'] = { content: result.SourceCode };
        } else {
            sources = JSON.parse(result.SourceCode.slice(1).slice(0, -1)).sources; // "{{ ... }}"の形で返却されるので、parse用に前後1文字ずつ削る
        }
        const filePaths = Object.keys(sources);
        filePaths.forEach((filePath) => {
            saveFileWithDir(contractName, filePath, replaceImport(filePaths, filePath, sources[filePath].content));
        });

        console.log('success!');
        console.log('Donloaded Folder: ' + SOURCE_DIR + '/' + contractName);

        function saveFileWithDir(contractName, filePath, content) {
            const lastSlashPos = filePath.lastIndexOf('/');
            const directory = SOURCE_DIR + '/' + contractName + '/' + filePath.substring(0, lastSlashPos);
            const file = directory + '/' + filePath.substring(lastSlashPos + 1);

            fs.mkdir(directory, { recursive: true }, (err) => {
                if (err) { throw err; }
                fs.writeFile(file, content, (err) => {
                    if (err) { throw err; }
                });
            });
        }

        function replaceImport(filePaths, filePath, content) {
            let lines = content.split('\n');
            const pathPrefix = makePathPrefix(filePath);
            for(i = 0; i < lines.length; ++i) {
                const importStr = 'import.*?';
                const search1 = new RegExp(importStr + '"(.*)');
                const search2 = new RegExp(importStr + "'(.*)");
                const result = lines[i].match(search1) || lines[i].match(search2);
                if (result !== null && result[1].slice(0, 1) !== '.') {
                    lines[i] = result[0].replace(result[1], pathPrefix + result[1]);
                }
            }

            return lines.join('\n');
        }

        function makePathPrefix(filePath) {
            const slashCount = (filePath.match(/\//g) || []).length;
            let prefix = '';
            for(i = 0; i < slashCount; ++i) {
                prefix += '../';
            }

            return prefix;
        }
    })

    function isOnce(sourceCode) {
        return sourceCode.slice(0, 2) !== '{{';
    }

    function isValidAddress(address) {
        // #codeを削る
        const roundStr = '#code';
        if (address.slice(-roundStr.length) === roundStr) {
            address = address.substring(0, address.length - roundStr.length);
        }

        return ethers.utils.isAddress(address);
    }

    function getApiResult(chain, network, address) {
        switch(chain) {
            case 'ethereum':
                const etherscanApiKey = process.env['ETHERSCAN_API_KEY'] || "";
                if (etherscanApiKey === "") {
                    console.log('Please set ETHERSCAN_API_KEY in .env file.');
                    return null;
                }
                const etherscanApi = require('etherscan-api').init(etherscanApiKey, network, TIMEOUT_MSEC);
                return etherscanApi.contract.getsourcecode(address).then((rawResult) => {
                    return rawResult.result[0];
                });
            case 'polygon':
                const polygonscanApiKey = process.env['POLYGONSCAN_API_KEY'] || "";
                if (polygonscanApiKey === "") {
                    console.log('Please set POLYGONSCAN_API_KEY in .env file.');
                    return null;
                }

                // npmが下記コードに未対応
                // const polygonscanApi = require('polygonscan-api').init(polygonscanApiKey, network, TIMEOUT_MSEC);
                // return polygonscanApi.contract.getsourcecode(address);

                const params = new URLSearchParams();
                params.append('module', 'contract');
                params.append('action', 'getsourcecode');
                params.append('address', address);
                params.append('apikey', polygonscanApiKey);
                return require('axios').get('https://api.polygonscan.com/api', { params }).then((rawResult) => {
                    return rawResult.status === 200 ? rawResult.data.result[0] : null;
                });
            default:
                console.log('unknown chain: ' + chain);
                return null;
        }
    }
}
