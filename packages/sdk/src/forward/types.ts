export type OrderKind = "contract-wide" | "single-token" | "token-list";

export enum Side {
  BID,
  LISTING,
}

export enum ItemKind {
  ERC721,
  ERC1155,
  ERC721_CRITERIA_OR_EXTERNAL,
  ERC1155_CRITERIA_OR_EXTERNAL,
}

export type Order = {
  kind?: OrderKind;
  side: Side;
  itemKind: ItemKind;
  maker: string;
  token: string;
  identifierOrCriteria: string;
  unitPrice: string;
  amount: string;
  salt: string;
  expiration: string;
  counter: string;
  signature?: string;
};

export type MatchParams = {
  fillAmount: string;
  tokenId?: string;
  criteriaProof?: string[];
};
