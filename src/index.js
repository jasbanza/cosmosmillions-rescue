// Import Big.js
import Big from 'big.js';

// Configure Big.js for high precision
Big.DP = 50; // Set decimal places
Big.RM = Big.roundHalfUp; // Rounding mode


window.listDeposits = listDeposits;
window.useConnectedWalletAddress = useConnectedWalletAddress;
window.btnDisconnectWallet = btnDisconnectWallet;
window.btnConnectWallet = btnConnectWallet;


// Configuration
const LCD_URL = "https://rest.cosmos.directory/lumnetwork";
const RPC_URL = "https://rpc.cosmos.directory/lumnetwork";
const CHAIN_ID = "lum-network-1";
const DENOM = "ulum";
const GAS_LIMIT = 200000;
const GAS_PRICE = "0.0025"; // in ulum

// Hardcoded denomination mapping
const DENOMINATIONS = {
    'ibc/A8C2D23A1E6F95DA4E48BA349667E322BD7A6C996D8A4AAE8BA72E190F3D1477': {
        name: 'ATOM',
        decimals: 6
    },
    'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2': {
        name: 'ATOM',
        decimals: 6
    },
    'ibc/51A818D8BBC385C152415882286C62169C05498B8EBCFB38310B1367583860FF': {
        name: 'HUAHUA',
        decimals: 6
    },
    'ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23': {
        name: 'OSMO',
        decimals: 6
    },
    'ibc/110A26548C514042AFDDEB1D4B46E71C1D43D9672659A3C958D7365FEECD9388': {
        name: 'INJ',
        decimals: 18
    }
};

// Loading state management
let isLoading = false;
let totalDeposits = 0;
let currentPage = 1;
(async () => {

    // waits for window.keplr to exist (if extension is installed, enabled and injecting its content script)
    await getKeplr();
    // ok keplr is present... enable chain
    await keplr_connectLum();

    // check URL for id field, and set value of orderId input
    const urlParams = new URLSearchParams(window.location.search);
    const walletAddress = urlParams.get('walletAddress');
    if (walletAddress) {
        document.getElementById("searchWalletAddress").value = walletAddress;
    }
})();

// // INITIALIZATION:
async function getKeplr() {
    if (window.keplr) {
        return window.keplr;
    }

    if (document.readyState === "complete") {
        return window.keplr;
    }

    return new Promise((resolve) => {
        const documentStateChange = (event) => {
            if (event.target && event.target.readyState === "complete") {
                resolve(window.keplr);
                document.removeEventListener("readystatechange", documentStateChange);
            }
        };

        document.addEventListener("readystatechange", documentStateChange);
    });
}

async function keplr_connectLum() {
    await suggestChainLum()
        .then(() => {
            // Chain suggested successfully
            console.log("Chain suggested successfully");
        })
        .catch((error) => {
            console.error("Error suggesting chain:", error);
        });

    await window.keplr
        ?.enable("lum-network-1")
        .then(async () => {
            // Connected
            keplr_chains_onConnected();
        })
        .catch(() => {
            // Rejected
            keplr_chains_onRejected();
        });
}

// get lum wallet from user's selected account in keplr extension
async function getLumWallet() {
    const wallet = await window.keplr?.getKey("lum-network-1").then((user_key) => {
        return user_key;
    });
    return wallet;
}
window.getLumWallet = getLumWallet;

// EVENT HANDLERS
async function keplr_chains_onConnected() {

    const wallet = await getLumWallet();
    ui_setWallet(wallet);

    // register event handler: if user changes account:
    window.addEventListener("keplr_keystorechange", keplr_keystore_onChange);
}

async function keplr_chains_onRejected() {
    ui_setWallet(undefined);
}

async function keplr_keystore_onChange(e) {
    const wallet = await getLumWallet();
    ui_setWallet(wallet);
}

// EXPORTED TO A GLOBAL "module" OBJECT FOR INLINE HTML DOM EVENT LISTENERS

export async function btnConnectKeplr_onClick() {
    // connect Keplr wallet extension
    await keplr_connectLum();
}


async function ui_setWallet(wallet) {
    if (wallet) {
        document.getElementById("connectedWalletAddress").innerHTML = wallet.bech32Address;
        ui_showElementById("walletContainer");
        // ui_showElementById("orders");
        ui_hideElementById("btnConnect");

        // await listDeposits(wallet.bech32Address);
        // await fetchAllDeposits(wallet.bech32Address);

    } else {
        ui_hideElementById("walletContainer");
        // ui_hideElementById("orders");
        ui_showElementById("btnConnect");
    }
    ui_reinitialize();
}
// function to reinitialize ui
function ui_reinitialize() {
    ui_hideResponse();
    ui_hideError();
}

/* show and hide response */
// function to update the last transaction hash
function ui_showResponse(result) {
    document.getElementById("divResponse").innerHTML = JSON.stringify(result, null, 2);
    ui_showElementById("responseContainer");
}
function ui_hideResponse() {
    document.getElementById("divResponse").innerHTML = "";
    ui_hideElementById("responseContainer");
}

/* show and hide error messages */
// error handlers
function ui_showError(errorMessage) {
    document.getElementById("divError").innerHTML = errorMessage;
    document.getElementById("errorContainer").classList.remove('hidden');
}
function ui_hideError() {
    document.getElementById("divError").innerHTML = "";
    document.getElementById("errorContainer").classList.add('hidden');
}

function btnDisconnectWallet() {
    // window.keplr?.signOut("osmosis-1");
    ui_setWallet(undefined);
}

function btnConnectWallet() {
    btnConnectKeplr_onClick();
}
function ui_showElementById(elementId) {
    try {
        document.getElementById(elementId).classList.remove('hidden');
    } catch (error) {
        console.warn(`ui_showElementById: elementId ${elementId} not found`);
    }
}
function ui_hideElementById(elementId) {
    try {
        document.getElementById(elementId).classList.add('hidden');
    } catch (error) {
        console.warn(`ui_hideElementById: elementId ${elementId} not found`);
    }
}

function useConnectedWalletAddress() {
    const connectedWalletAddress = document.getElementById("connectedWalletAddress").textContent.trim();

    document.getElementById("searchWalletAddress").value = connectedWalletAddress;
}




// Helper function to toggle loading state
function toggleLoading(isLoadingState, progressMessage = "", contextMessage = "") {

    const loadingMask = document.getElementById('loadingMask');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingContext = document.getElementById('loadingContext');
    isLoading = isLoadingState;
    loadingMask.classList.toggle('active', isLoadingState);

    if (isLoadingState) {
        loadingProgress.textContent = progressMessage || "Loading deposits...";
        loadingContext.textContent = contextMessage || "Please wait while we fetch your deposits...";
    }

    // Disable/enable all buttons when loading
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = isLoadingState;
        button.classList.toggle('loading', isLoadingState);
    });
}

// Helper to display errors
function showError(message) {
    document.getElementById("error").textContent = message;
}


// Fetch all deposits and return all deposits and filtered user deposits.
async function fetchAllDeposits(address) {
    totalDeposits = 0;
    currentPage = 1;
    let nextKey = null;
    const limit = 100;
    const userDeposits = [];
    const allDeposits = [];

    do {
        try {
            const url = `${LCD_URL}/lum-network/millions/deposits?pagination.limit=${limit}${nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : ""}`;
            console.log(`Fetching page ${currentPage}: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`HTTP error: ${response.status}`);
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Page ${currentPage} response:`, data);

            const pageDeposits = data.deposits || [];
            const filteredDeposits = pageDeposits.filter((deposit) => deposit.depositor_address === address);
            userDeposits.push(...filteredDeposits);
            allDeposits.push(...pageDeposits);
            totalDeposits += filteredDeposits.length;

            // Update loading progress
            toggleLoading(true,
                `Found ${totalDeposits} deposits for address...`,
                `Processing page ${currentPage} of deposits...`
            );

            nextKey = data.pagination?.next_key || null;
            currentPage++;
        } catch (error) {
            console.error('Error fetching deposits:', error);
            throw new Error(`Error fetching deposits page: ${error.message}`);
        }
    } while (nextKey);

    console.log('User deposits count:', userDeposits.length);
    return { userDeposits, allDeposits };
}

// Query user deposits
async function listDeposits() {
    if (isLoading) return;
    const address = document.getElementById("searchWalletAddress").value.trim();
    if (!address.startsWith("lum1")) {
        showError("Please enter a valid Lum address (lum1...)");
        return;
    }
    try {
        showError("");
        toggleLoading(true, "Fetching global statistics...", "Please wait...");
        
        // Then fetch user deposits
        const { userDeposits, allDeposits } = await fetchAllDeposits(address);
        
        // Process pool statistics
        const poolStats = allDeposits.reduce((stats, deposit) => {
            const poolId = deposit.pool_id;
            let coingeckoId = null;
            if (!stats[poolId]) {
                switch (poolId) {
                    case "2":
                        coingeckoId = 'cosmos';
                        break;
                    case "3":
                        coingeckoId = 'chihuahua-chain';
                        break;
                    case "4":
                        coingeckoId = 'osmosis';
                        break;
                    case "5":
                        coingeckoId = 'injective-protocol';
                        break;
                    default:
                        coingeckoId = null;
                }
                stats[poolId] = {
                    pool_id: poolId,
                    total_deposited: { denom: deposit.amount.denom, amount: '0' },
                    deposit_count: 0,
                    coingecko_id: coingeckoId,
                };
            }
            // Add to total deposited
            stats[poolId].total_deposited.amount =
                (BigInt(stats[poolId].total_deposited.amount) + BigInt(deposit.amount.amount)).toString();
            // Increment deposit count
            stats[poolId].deposit_count++;
            return stats;
        }, {});

        // Update global deposits table
        await updateGlobalDepositsTable(Object.values(poolStats));

        const tbody = document.getElementById("depositsBody");
        tbody.innerHTML = "";

        // Check if there are deposits for this address
        if (userDeposits.length === 0) {
            showError("No deposits found for this address.");
            return;
        }

        // Display deposits
        userDeposits.forEach((deposit) => {
            const row = document.createElement("tr");
            const denomInfo = DENOMINATIONS[deposit.amount.denom];
            const amount = denomInfo ?
                `${deposit.amount.amount / Math.pow(10, denomInfo.decimals)} ${denomInfo.name}` :
                `${deposit.amount} ${deposit.amount.denom}`;
            row.innerHTML = `
                <td>${deposit.deposit_id}</td>
                <td>${deposit.pool_id}</td>
                <td>${amount}</td>
                <td><button onclick="withdrawDeposit('${address}', '${deposit.pool_id}', '${deposit.deposit_id}')" class="action-button">Withdraw</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        showError(`Error fetching deposits: ${error.message}`);
    } finally {
        toggleLoading(false);
    }
}


async function updateGlobalDepositsTable(globalDeposits) {
    const tbody = document.getElementById("globalDepositsBody");
    tbody.innerHTML = "";

    const coingeckoIds = globalDeposits.map(pool => pool.coingecko_id).filter(id => id !== null);
    const uniqueCoingeckoIds = [...new Set(coingeckoIds)];
    const prices = await getCryptoPrices(uniqueCoingeckoIds.toString());

    const globalDepositsWithPrices = globalDeposits.map(pool => {
        const price = new Big(prices[pool.coingecko_id] || 0);
        const amount = new Big(formatAmountByDenom(pool.total_deposited));

        // Calculate with high precision
        const valueUSD = amount.mul(price);
        // Convert to string with 2 decimal places
        const valueUSDRounded = valueUSD.toFixed(2, 1); // 1 is the rounding mode for roundHalfUp

        return {
            ...pool,
            valueUSD: valueUSDRounded,
        };
    });
    globalDepositsWithPrices.forEach((pool) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${pool.pool_id}</td>
            <td>${formatAmount(pool.total_deposited)}</td>
            <td>${pool.deposit_count}</td>
            <td>${pool.valueUSD ? pool.valueUSD : 'N/A'}</td>
        `;
        // <td>${pool.valueUSD ? pool.valueUSD.toFixed(2) : 'N/A'}</td>
        tbody.appendChild(row);
    });
}

async function getCryptoPrices(strIds) {

    // CoinGecko API endpoint for fetching prices
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${strIds}&vs_currencies=usd`;

    try {
        // Fetch the price data
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Calculate the USD value for each cryptocurrency
        const prices = Object.keys(data).reduce((acc, key) => {
            acc[key] = data[key].usd;
            return acc;
        }, {});

        return prices;


    } catch (error) {
        console.error('Error fetching prices:', error);
        throw error;
    }
}


function formatAmount(amount) {
    const denomInfo = DENOMINATIONS[amount.denom];
    return denomInfo ?
        `${amount.amount / Math.pow(10, denomInfo.decimals)} ${denomInfo.name}` :
        `${amount.amount} ${amount.denom}`;
}

function formatAmountByDenom(amount) {
    const denomInfo = DENOMINATIONS[amount.denom];
    return denomInfo ?
        `${amount.amount / Math.pow(10, denomInfo.decimals)}` :
        `${amount.amount}`;
}

// Withdraw a deposit
async function withdrawDeposit(depositor, poolId, depositId) {
    if (isLoading) return;

    try {
        showError("");
        toggleLoading(true, "Preparing withdrawal...", "Please confirm the transaction in your wallet");

        // Ensure Keplr is available
        if (!window.keplr) {
            showError("Keplr wallet not detected. Please install Keplr extension.");
            return;
        }

        // Enable Keplr for Lum Network
        await window.keplr.enable(CHAIN_ID);
        const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
        const accounts = await offlineSigner.getAccounts();

        if (accounts[0].address !== depositor) {
            showError("Keplr address does not match provided address.");
            return;
        }

        // Get account details
        const accountResponse = await fetch(
            `${LCD_URL}/cosmos/auth/v1beta1/accounts/${depositor}`
        );
        const accountData = await accountResponse.json();
        const account = accountData.account;
        const sequence = account.sequence;
        const accountNumber = account.account_number;

        // Construct MsgWithdrawDeposit
        const msg = {
            type: "lum-network/millions/MsgWithdrawDeposit",
            value: {
                depositor_address: depositor,
                pool_id: poolId,
                deposit_id: depositId,
            },
        };

        // Fee
        const fee = {
            amount: [{
                denom: DENOM,
                amount: Math.ceil(GAS_LIMIT * parseFloat(GAS_PRICE)).toString(),
            }],
            gas: GAS_LIMIT.toString(),
        };

        // Sign transaction
        const signDoc = {
            body: {
                messages: [msg],
                memo: "",
                timeout_height: "0",
                extension_options: [],
                non_critical_extension_options: [],
            },
            auth_info: {
                signer_infos: [{
                    public_key: {
                        type: "tendermint/PubKeySecp256k1",
                        key: accounts[0].pubkey,
                    },
                    mode_info: { single: { mode: "SIGN_MODE_DIRECT" } },
                    sequence: sequence.toString(),
                }],
                fee,
            },
            chain_id: CHAIN_ID,
            account_number: accountNumber.toString(),
        };

        const signed = await window.keplr.signDirect(CHAIN_ID, depositor, {
            bodyBytes: serializeBody(signDoc.body),
            authInfoBytes: serializeAuthInfo(signDoc.auth_info),
            chainId: CHAIN_ID,
            accountNumber: accountNumber,
        });

        // Construct transaction
        const tx = {
            signatures: [signed.signature.signature],
            body: signed.signed.body,
            auth_info: signed.signed.auth_info,
        };

        // Broadcast transaction
        const broadcastResponse = await fetch(`${RPC_URL}/txs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tx,
                mode: "BROADCAST_MODE_BLOCK",
            }),
        });

        const broadcastResult = await broadcastResponse.json();

        if (broadcastResult.result?.code !== 0) {
            throw new Error(broadcastResult.result?.raw_log || "Transaction failed");
        }

        alert(`Withdrawal successful! Tx Hash: ${broadcastResult.result.txhash}`);
        listDeposits(); // Refresh deposit list
    } catch (error) {
        showError(`Error withdrawing deposit: ${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

// Helper to serialize transaction body
function serializeBody(body) {
    return Buffer.from(JSON.stringify(body)).toString("base64");
}

// Helper to serialize auth info
function serializeAuthInfo(authInfo) {
    return Buffer.from(JSON.stringify(authInfo)).toString("base64");
}

// // Initialize Keplr chain configuration
async function suggestChainLum() {
    if (!window.keplr) return;
    await window.keplr.experimentalSuggestChain({
        chainId: CHAIN_ID,
        chainName: 'Lum Network',
        rpc: RPC_URL,
        rest: LCD_URL,
        bip44: {
            coinType: 118,
        },
        bech32Config: {
            bech32PrefixAccAddr: "lum",
            bech32PrefixAccPub: "lum" + "pub",
            bech32PrefixValAddr: "lum" + "valoper",
            bech32PrefixValPub: "lum" + "valoperpub",
            bech32PrefixConsAddr: "lum" + "valcons",
            bech32PrefixConsPub: "lum" + "valconspub"
        },
        currencies: [{
            coinDenom: DENOM,
            coinMinimalDenom: DENOM,
            coinDecimals: 6,
        }],
        feeCurrencies: [{
            coinDenom: DENOM,
            coinMinimalDenom: DENOM,
            coinDecimals: 6,
        }],
        staking: {
            bondDenom: DENOM,
        },
        validator: {
            pubKeyTypes: ['secp256k1'],
        }
    });
}