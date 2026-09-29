/**
 * Utility functions for Granular Per-Product Coin Earning, Individual Redemption Limits, and Cart Stacking Calculation.
 */

export function getProductCoinRules(product = {}) {
  const allowCoinRedemption = product?.allowCoinRedemption !== false;

  const rewardCoinsEarned = Number(
    product?.rewardCoinsEarned ??
    product?.coinsRewardedOnPurchase ??
    product?.rcCoins ??
    0
  );

  const coinsToDeduct = Number(
    product?.coinsToDeduct ??
    product?.maxCoinsRedeemable ??
    0
  );

  const rupeeDiscountGiven = Number(
    product?.rupeeDiscountGiven ??
    product?.coinDiscountAmount ??
    0
  );

  return {
    allowCoinRedemption,
    rewardCoinsEarned,
    coinsToDeduct,
    rupeeDiscountGiven
  };
}

export function computeStackedCoinRedemption(cartItems = [], userWalletCoins = 0) {
  const walletCoins = Math.max(0, Number(userWalletCoins || 0));

  const unitOffers = [];
  (cartItems || []).forEach(item => {
    if (!item) return;
    const rules = getProductCoinRules(item);
    if (!rules.allowCoinRedemption) return;

    const qty = Math.max(1, Number(item?.quantity || item?.qty || 1));
    if (rules.coinsToDeduct > 0 && rules.rupeeDiscountGiven > 0) {
      for (let i = 0; i < qty; i++) {
        unitOffers.push({
          cartItemId: item?.cartItemId || item?.id || Math.random(),
          productId: item?.id || item?._id || Math.random(),
          title: item?.title || item?.name || 'RC Machine',
          coinsToDeduct: rules.coinsToDeduct,
          rupeeDiscountGiven: rules.rupeeDiscountGiven,
          ratio: rules.rupeeDiscountGiven / rules.coinsToDeduct
        });
      }
    }
  });

  const totalCartCoinsRequired = unitOffers.reduce((sum, u) => sum + (u.coinsToDeduct || 0), 0);
  const totalCartRupeeDiscountAvailable = unitOffers.reduce((sum, u) => sum + (u.rupeeDiscountGiven || 0), 0);

  if (unitOffers.length === 0 || walletCoins <= 0) {
    return {
      totalCartCoinsRequired,
      totalCartRupeeDiscountAvailable,
      totalCoinsToBurn: 0,
      totalRupeeDiscount: 0,
      itemizedBreakdown: [],
      canRedeem: false,
      isFullyCovered: false,
      remainingWalletCoins: walletCoins
    };
  }

  // Sort by highest discount per coin ratio, then by lowest coins required
  unitOffers.sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return a.coinsToDeduct - b.coinsToDeduct;
  });

  let currentBalance = walletCoins;
  let totalCoinsToBurn = 0;
  let totalRupeeDiscount = 0;
  const appliedOffers = [];

  for (const offer of unitOffers) {
    if (currentBalance >= offer.coinsToDeduct) {
      currentBalance -= offer.coinsToDeduct;
      totalCoinsToBurn += offer.coinsToDeduct;
      totalRupeeDiscount += offer.rupeeDiscountGiven;
      appliedOffers.push(offer);
    }
  }

  // Group applied offers for clean itemized summary
  const groupMap = new Map();
  appliedOffers.forEach(off => {
    const key = off.productId || off.title;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        title: off.title,
        units: 0,
        coinsDeducted: 0,
        rupeeDiscount: 0
      });
    }
    const group = groupMap.get(key);
    group.units += 1;
    group.coinsDeducted += off.coinsToDeduct;
    group.rupeeDiscount += off.rupeeDiscountGiven;
  });

  const itemizedBreakdown = Array.from(groupMap.values());

  return {
    totalCartCoinsRequired,
    totalCartRupeeDiscountAvailable,
    totalCoinsToBurn,
    totalRupeeDiscount,
    itemizedBreakdown,
    canRedeem: totalCoinsToBurn > 0,
    isFullyCovered: totalCoinsToBurn === totalCartCoinsRequired,
    remainingWalletCoins: currentBalance
  };
}
