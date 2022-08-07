// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {BaseMarket} from "../BaseMarket.sol";
import {ISeaport} from "../../interfaces/ISeaport.sol";

contract SeaportMarket is BaseMarket {
    using SafeERC20 for IERC20;

    // --- Structs ---

    struct SeaportFulfillments {
        ISeaport.FulfillmentComponent[][] offer;
        ISeaport.FulfillmentComponent[][] consideration;
    }

    // --- Fields ---

    address public immutable exchange =
        0x00000000006c3852cbEf3e08E8dF289169EdE581;

    // --- Constructor ---

    constructor(address router) BaseMarket(router) {}

    // --- Single ETH listing ---

    function acceptETHListing(
        ISeaport.AdvancedOrder calldata order,
        ETHListingParams calldata params
    ) external payable nonReentrant refundETHLeftover(params.refundTo) {
        fillSingleOrder(
            order,
            params.fillTo,
            params.revertIfIncomplete,
            params.amount
        );
    }

    function acceptETHListingWithFees(
        ISeaport.AdvancedOrder calldata order,
        ETHListingParams calldata params,
        Fee[] calldata fees
    )
        external
        payable
        nonReentrant
        refundETHLeftover(params.refundTo)
        chargeETHFees(fees, params.amount)
    {
        fillSingleOrder(
            order,
            params.fillTo,
            params.revertIfIncomplete,
            params.amount
        );
    }

    // --- Single ERC20 listing ---

    function acceptERC20Listing(
        ISeaport.AdvancedOrder calldata order,
        ERC20ListingParams calldata params
    ) external nonReentrant refundERC20Leftover(params.refundTo, params.token) {
        IERC20(params.token).safeApprove(exchange, params.amount);
        fillSingleOrder(order, params.fillTo, params.revertIfIncomplete, 0);
    }

    function acceptERC20ListingWithFees(
        ISeaport.AdvancedOrder calldata order,
        ERC20ListingParams calldata params,
        Fee[] calldata fees
    )
        external
        nonReentrant
        refundERC20Leftover(params.refundTo, params.token)
        chargeERC20Fees(fees, params.token, params.amount)
    {
        IERC20(params.token).safeApprove(exchange, params.amount);
        fillSingleOrder(order, params.fillTo, params.revertIfIncomplete, 0);
    }

    // --- Multiple ETH listings ---

    function acceptMultipleETHListings(
        ISeaport.AdvancedOrder[] calldata orders,
        // Use `memory` instead of `calldata` to avoid `Stack too deep` errors
        SeaportFulfillments memory fulfillments,
        ETHListingParams calldata params
    ) external payable nonReentrant refundETHLeftover(params.refundTo) {
        fillMultipleOrders(
            orders,
            fulfillments,
            params.fillTo,
            params.revertIfIncomplete,
            params.amount
        );
    }

    function acceptMultipleETHListingsWithFees(
        ISeaport.AdvancedOrder[] calldata orders,
        // Use `memory` instead of `calldata` to avoid `Stack too deep` errors
        SeaportFulfillments memory fulfillments,
        ETHListingParams calldata params,
        Fee[] calldata fees
    )
        external
        payable
        nonReentrant
        refundETHLeftover(params.refundTo)
        chargeETHFees(fees, params.amount)
    {
        fillMultipleOrders(
            orders,
            fulfillments,
            params.fillTo,
            params.revertIfIncomplete,
            params.amount
        );
    }

    // --- Multiple ERC20 listings ---

    function acceptMultipleERC20Listings(
        ISeaport.AdvancedOrder[] calldata orders,
        // Use `memory` instead of `calldata` to avoid `Stack too deep` errors
        SeaportFulfillments memory fulfillments,
        ERC20ListingParams calldata params
    ) external nonReentrant refundERC20Leftover(params.refundTo, params.token) {
        IERC20(params.token).safeApprove(exchange, params.amount);
        fillMultipleOrders(
            orders,
            fulfillments,
            params.fillTo,
            params.revertIfIncomplete,
            0
        );
    }

    function acceptMultipleERC20ListingsWithFees(
        ISeaport.AdvancedOrder[] calldata orders,
        // Use `memory` instead of `calldata` to avoid `Stack too deep` errors
        SeaportFulfillments memory fulfillments,
        ERC20ListingParams calldata params,
        Fee[] calldata fees
    )
        external
        nonReentrant
        refundERC20Leftover(params.refundTo, params.token)
        chargeERC20Fees(fees, params.token, params.amount)
    {
        IERC20(params.token).safeApprove(exchange, params.amount);
        fillMultipleOrders(
            orders,
            fulfillments,
            params.fillTo,
            params.revertIfIncomplete,
            0
        );
    }

    // --- Generic handler (used for Seaport-based approvals) ---

    function matchOrders(
        ISeaport.Order[] calldata orders,
        ISeaport.Fulfillment[] calldata fulfillments
    ) external {
        ISeaport(exchange).matchOrders(orders, fulfillments);
    }

    // --- Internal ---

    function fillSingleOrder(
        ISeaport.AdvancedOrder calldata order,
        address receiver,
        bool revertIfIncomplete,
        uint256 value
    ) internal {
        bool success;
        try
            ISeaport(exchange).fulfillAdvancedOrder{value: value}(
                order,
                new ISeaport.CriteriaResolver[](0),
                bytes32(0),
                receiver
            )
        returns (bool fulfilled) {
            success = fulfilled;
        } catch {}

        if (revertIfIncomplete && !success) {
            revert UnsuccessfulFill();
        }
    }

    function fillMultipleOrders(
        ISeaport.AdvancedOrder[] calldata orders,
        // Use `memory` instead of `calldata` to avoid `Stack too deep` errors
        SeaportFulfillments memory fulfillments,
        address receiver,
        bool revertIfIncomplete,
        uint256 value
    ) internal {
        (bool[] memory fulfilled, ) = ISeaport(exchange)
            .fulfillAvailableAdvancedOrders{value: value}(
            orders,
            new ISeaport.CriteriaResolver[](0),
            fulfillments.offer,
            fulfillments.consideration,
            bytes32(0),
            receiver,
            // Assume at most 255 orders can be filled at once
            0xff
        );

        if (revertIfIncomplete) {
            uint256 length = fulfilled.length;
            for (uint256 i = 0; i < length; ) {
                if (!fulfilled[i]) {
                    revert UnsuccessfulFill();
                }

                unchecked {
                    ++i;
                }
            }
        }
    }
}