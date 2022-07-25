import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { randomBytes } from "@ethersproject/random";
import { toUtf8Bytes } from "@ethersproject/strings";

// Constants

export const BytesEmpty = "0x";
export const MaxUint256 = BigNumber.from("0x" + "f".repeat(64));

// Random

export const getRandomBytes = (numBytes = 32) => bn(randomBytes(numBytes));

// BigNumber

export const bn = (value: BigNumberish) => BigNumber.from(value);

// Time

export const getCurrentTimestamp = (delay = 0) =>
  Math.floor(Date.now() / 1000 + delay);

// Ease of use

export const lc = (x: string) => x?.toLowerCase();
export const n = (x: any) => (x ? Number(x) : x);
export const s = (x: any) => (x ? String(x) : x);

// Misc

// Use the ASCII US (unit separator) character (code = 31) as a delimiter
export const generateReferrerBytes = (referrer?: string) =>
  referrer ? `1f${Buffer.from(toUtf8Bytes(referrer)).toString("hex")}1f` : "";

// Types

export type TxData = {
  from: string;
  to: string;
  data: string;
  value?: string;
};

export enum Network {
  // Ethereum
  Ethereum = 1,
  EthereumRinkeby = 4,
  EthereumGoerli = 5,
  EthereumKovan = 42,
  // Optimism
  Optimism = 10,
  OptimismKovan = 69,
  // Gnosis
  Gnosis = 100,
  // Polygon
  Polygon = 137,
  PolygonMumbai = 80001,
  // Arbitrum
  Arbitrum = 42161,
  // Avalanche
  Avalanche = 43114,
  AvalancheFuji = 43113,
}

export type ChainIdToAddress = { [chainId: number]: string };
export type ChainIdToAddressList = { [chainId: number]: string[] };
export type ChainIdToAddressMap = {
  [chainId: number]: { [address: string]: string };
};
