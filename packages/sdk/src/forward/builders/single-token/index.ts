import { BigNumberish } from "@ethersproject/bignumber";

import { BaseBuildParams, BaseBuilder } from "../base";
import { Order } from "../../order";
import * as Types from "../../types";
import { s } from "../../../utils";

interface BuildParams extends BaseBuildParams {
  tokenId: BigNumberish;
  external?: boolean;
}

export class SingleTokenBuilder extends BaseBuilder {
  public isValid(order: Order): boolean {
    try {
      const copyOrder = this.build({
        ...order.params,
        side: order.params.side === Types.Side.BID ? "buy" : "sell",
        tokenKind:
          order.params.itemKind === Types.ItemKind.ERC721
            ? "erc721"
            : "erc1155",
        contract: order.params.token,
        tokenId: order.params.identifierOrCriteria,
      } as any);

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
    if (params.external && params.side !== "sell") {
      throw new Error("Mismatching params");
    }

    this.defaultInitialize(params);

    return new Order(this.chainId, {
      kind: "single-token",
      side: params.side === "buy" ? Types.Side.BID : Types.Side.LISTING,
      itemKind:
        (params.tokenKind === "erc721"
          ? Types.ItemKind.ERC721
          : Types.ItemKind.ERC1155) + (params.external ? 2 : 0),
      maker: params.maker,
      token: params.contract,
      identifierOrCriteria: s(params.tokenId),
      unitPrice: s(params.unitPrice),
      amount: params.amount!,
      salt: s(params.salt!),
      counter: s(params.counter),
      expiration: s(params.expiration!),
    });
  }

  public buildMatching(
    _order: Order,
    data?: { amount?: BigNumberish }
  ): Types.MatchParams {
    return {
      fillAmount: data?.amount ? s(data.amount) : "1",
    };
  }
}
