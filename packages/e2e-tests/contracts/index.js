const fetch = require("node-fetch");
const fs = require('fs/promises')
const { CONTRACT_WASM_URLS } = require("../constants");

const fetchAsBuffer = (url) => fetch(url).then((a) => a.buffer());

const fetchLinkdropContract = () => fetchAsBuffer(CONTRACT_WASM_URLS.LINKDROP);
/**
 * 
 * @param {{v2Wasm: boolean}} param0 
 * @returns {Promise<Buffer>}
 */
const fetchLockupContract = ({ v2Wasm } = {}) => fetchAsBuffer(CONTRACT_WASM_URLS[v2Wasm ? "LOCKUP_V2" : "LOCKUP"]);

const fetchNftContract = () => {
    return fs.readFile("./contracts/non_fungible_token.wasm")
}

module.exports = { fetchLinkdropContract, fetchLockupContract, fetchNftContract };
