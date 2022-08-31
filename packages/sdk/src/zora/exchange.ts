import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "ethers";
import { Contract, ContractTransaction } from "@ethersproject/contracts";
import * as Addresses from "./addresses";
import { Order } from "./order";
import * as Types from "./types";
import { TxData, bn, generateReferrerBytes } from "../utils";
import ExchangeAbi from "./abis/Exchange.json";

export class Exchange {
  public chainId: number;
  public contract: Contract;

  constructor(chainId: number) {
    this.chainId = chainId;
    this.contract = new Contract(
      Addresses.Exchange[this.chainId],
      ExchangeAbi as any
    );
  }

  // --- Fill order ---

  public async fillOrder(
    taker: Signer,
    takerOrderParams: Types.TakerOrderParams,
    options?: {
      referrer?: string;
    }
  ): Promise<ContractTransaction> {
    const tx = this.fillOrderTx(
      await taker.getAddress(),
      takerOrderParams,
      options
    );
    return taker.sendTransaction(tx);
  }

  public fillOrderTx(
    taker: string,
    takerOrderParams: Types.TakerOrderParams,
    options?: {
      referrer?: string;
    }
  ): TxData {
    let data: string;
    let value: string | undefined;

    data = this.contract.interface.encodeFunctionData("fillAsk", [
      takerOrderParams,
    ]);
    value = takerOrderParams._fillAmount;

    return {
      from: taker,
      to: this.contract.address,
      data: data + generateReferrerBytes(options?.referrer),
      value: value && bn(value).toHexString(),
    };
  }

  // --- Cancel order ---

  public async cancelOrder(
    maker: Signer,
    order: Order
  ): Promise<ContractTransaction> {
    const tx = this.cancelOrderTx(await maker.getAddress(), order);
    return maker.sendTransaction(tx);
  }

  public cancelOrderTx(maker: string, order: Order): TxData {
    return {
      from: maker,
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData("cancelAsk", [
        order.params._tokenContract,
        order.params._tokenId,
      ]),
    };
  }

  // --- Get nonce ---

  public async getNonce(
    provider: Provider,
    user: string
  ): Promise<BigNumberish> {
    return new Contract(Addresses.Exchange[this.chainId], ExchangeAbi as any)
      .connect(provider)
      .userMinOrderNonce(user);
  }
}