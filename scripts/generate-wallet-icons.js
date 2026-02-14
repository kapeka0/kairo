const fs = require('fs');
const path = require('path');

const cryptoNames = {
  'btc': 'Bitcoin',
  'eth': 'Ethereum',
  'bnb': 'Binance Coin',
  'ada': 'Cardano',
  'sol': 'Solana',
  'dot': 'Polkadot',
  'matic': 'Polygon',
  'avax': 'Avalanche',
  'link': 'Chainlink',
  'uni': 'Uniswap',
  'usdt': 'Tether',
  'usdc': 'USD Coin',
  'dai': 'Dai',
  'aave': 'Aave',
  'mkr': 'Maker',
  'xrp': 'Ripple',
  'doge': 'Dogecoin',
  'shib': 'Shiba Inu',
  'ltc': 'Litecoin',
  'bch': 'Bitcoin Cash',
  'atom': 'Cosmos',
  'xmr': 'Monero',
  'xlm': 'Stellar',
  'algo': 'Algorand',
  'vet': 'VeChain',
  'fil': 'Filecoin',
  'trx': 'Tron',
  'eos': 'EOS',
  'xtz': 'Tezos',
  'cake': 'PancakeSwap',
  'sushi': 'SushiSwap',
  'comp': 'Compound',
  'snx': 'Synthetix',
  'crv': 'Curve',
  'yfi': 'yearn.finance',
};

const logosDir = path.join(__dirname, '../public/images/logos/crypto');
const files = fs.readdirSync(logosDir);

const icons = files
  .filter(file => file.endsWith('.svg'))
  .map(file => {
    const key = file.replace('.svg', '');
    const name = cryptoNames[key] || key.toUpperCase();
    return { name, src: `/images/logos/crypto/${file}` };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`export const WALLET_ICONS: IconDefinition[] = ${JSON.stringify(icons, null, 2)};`);
