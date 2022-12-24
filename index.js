require('dotenv').config();
require('commander')
    .version('0.0.3')
    .usage('[options] address')
    .option('-n, --network <chain>', 'chain', 'mainnet')
    .argument('<address>')
    .action((address, options) => {
        main(address, options);
    }).parse(process.argv);

function main(address, options) {
    const ethers = require('ethers');
    const fs = require('fs');
    const TIMEOUT_MSEC = 3000;
    const SOURCE_DIR = 'sources';
    const etherscanApiKey = process.env['ETHERSCAN_API_KEY'] || "";

    if (etherscanApiKey === "") {
        console.log('Please set ETHERSCAN_API_KEY in .env file.');
        return;
    }

    // #codeを削る
    const roundStr = '#code';
    if (address.slice(-roundStr.length) === roundStr) {
        address = address.substring(0, address.length - roundStr.length);
    }

    if (ethers.utils.isAddress(address) === false) {
        console.log('invalid address: ' + address);
        return;
    }

    const api = require('etherscan-api').init(etherscanApiKey, options.network, TIMEOUT_MSEC);
    api.contract.getsourcecode(address).then((rawResult) => {
        const result = rawResult.result[0];
        if (result.SourceCode === '') {
            console.log('Source code not found');
            return;
        }
        const contractName = result.ContractName;
        const sources = JSON.parse(result.SourceCode.slice(1).slice(0, -1)).sources; // "{{ ... }}"の形で返却されるので、parse用に前後1文字ずつ削る
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
    });
}
