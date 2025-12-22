import { Holding } from "@/types";

interface CoinGeckoResponse {
    [coinId: string]: {
        eur: number;
    };
}

// Uitgebreide mapping van Symbol naar CoinGecko ID
const SYMBOL_TO_ID: { [key: string]: string } = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  USDC: "usd-coin",
  ADA: "cardano",
  DOT: "polkadot",
  LINK: "chainlink",
  STRAX: "stratis",
  NEX: "neon-exchange",
  BAND: "band-protocol",
  KNC: "kyber-network-crystal",
  POWR: "power-ledger",
  YEARN: "yearn-finance",
  EIGEN: "eigenlayer",
  OMG: "omisego",
  UTK: "xmoney-2",

  // Voeg meer toe indien nodig
};

export async function getLivePrices(holdings: Holding[]) {
  const idToSymbolMap: { [id: string]: string } = {};
  const idsToFetch: string[] = [];
  
  // 1. We maken een apart mapje voor prijzen die we al weten (EUR)
  const fiatPrices: { [symbol: string]: number } = {
    "EUR": 1.0,  // Hardcoded: Euro is altijd 1
  };

  holdings.forEach((h) => {
    const symbolUpper = h.symbol.toUpperCase();
    const nameLower = h.name.toLowerCase().replace(/ /g, "-");

    // CHECK VOOR FIAT
    if (symbolUpper === "EUR") {
        fiatPrices["EUR"] = 1.0; 
        return; // Klaar, hoeft niet naar API
    }
    if (symbolUpper === "USD") {
        idsToFetch.push("tether"); 
        idToSymbolMap["tether"] = "USD"; 
        return;
    }

    // CHECK VOOR CRYPTO
    let geckoId = "";
    if (SYMBOL_TO_ID[symbolUpper]) {
      geckoId = SYMBOL_TO_ID[symbolUpper];
    } else {
      geckoId = nameLower;
    }

    if (geckoId) {
      idsToFetch.push(geckoId);
      idToSymbolMap[geckoId] = h.symbol; 
    }
  });

  // 2. Haal de rest op via API
  let apiPrices: CoinGeckoResponse = {};
  const uniqueIds = Array.from(new Set(idsToFetch)).join(",");

  if (uniqueIds) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=eur`
        );
        apiPrices = await response.json();
      } catch (e) {
          console.error("API Error:", e);
      }
  }

  // 3. HET SAMENVOEGEN (Hier ging het waarschijnlijk mis)
  // We beginnen met de fiat prijzen (EUR) en voegen de API resultaten erbij
  const finalPriceMap: { [symbol: string]: number } = { ...fiatPrices };

  Object.keys(apiPrices).forEach((geckoId) => {
    const price = apiPrices[geckoId].eur;
    // Zoek welk symbool (BTC) bij dit ID (bitcoin) hoorde
    const originalSymbol = idToSymbolMap[geckoId];
    
    if (originalSymbol) {
      finalPriceMap[originalSymbol] = price;
    }
  });

  return finalPriceMap;
}