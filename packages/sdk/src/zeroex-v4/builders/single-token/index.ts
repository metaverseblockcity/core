import { BigNumberish } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";

import { BaseBuildParams, BaseBuilder } from "../base";
import * as Addresses from "../../addresses";
import { Order } from "../../order";
import * as Types from "../../types";
import * as CommonAddresses from "../../../common/addresses";
import { s } from "../../../utils";

interface BuildParams extends BaseBuildParams {
  tokenId: BigNumberish;
}

export class SingleTokenBuilder extends BaseBuilder {
  public isValid(order: Order): boolean {
    try {
      const copyOrder = this.build({
        ...order.params,
        direction:
          order.params.direction === Types.TradeDirection.SELL ? "sell" : "buy",
        contract: order.params.nft,
        maker: order.params.maker,
        price: order.params.erc20TokenAmount,
        amount: order.params.nftAmount,
        tokenId: order.params.nftId,
      });

      if (!copyOrder) {
        return false;
      }

      if (copyOrder.hash() !== order.hash()) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  public build(params: BuildParams) {
    this.defaultInitialize(params);

    return new Order(this.chainId, {
      kind: params.amount ? "erc1155-single-token" : "erc721-single-token",
      direction:
        params.direction === "sell"
          ? Types.TradeDirection.SELL
          : Types.TradeDirection.BUY,
      maker: params.maker,
      taker: AddressZero,
      expiry: params.expiry!,
      nonce: s(params.nonce)!,
      erc20Token:
        params.direction === "sell"
          ? Addresses.Eth[this.chainId]
          : CommonAddresses.Weth[this.chainId],
      erc20TokenAmount: s(params.price),
      fees: [],
      nft: params.contract,
      nftId: s(params.tokenId),
      nftProperties: [],
      nftAmount: params.amount ? s(params.amount) : undefined,
      signatureType: params.signatureType,
      v: params.v,
      r: params.r,
      s: params.s,
    });
  }

  public buildMatching(order: Order, data?: { amount?: BigNumberish }) {
    return {
      nftId: order.params.nftId,
      nftAmount: data?.amount ? s(data.amount) : undefined,
    };
  }
}