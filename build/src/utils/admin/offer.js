"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldUpdateOffer = exports.calculateOfferPrice = void 0;
const offers_1 = require("../../constants/offers");
function calculateOfferPrice(offerType, offerIN, basePrice) {
    if (offerType === offers_1.offerTypes.percent) {
        return basePrice - (basePrice * (offerIN / 100));
    }
    else if (offerType === offers_1.offerTypes.amountOff) {
        return basePrice - offerIN;
    }
    return basePrice;
}
exports.calculateOfferPrice = calculateOfferPrice;
function shouldUpdateOffer(currentOffersBy, existingOffersBy) {
    if (!existingOffersBy)
        return true;
    if (currentOffersBy === offers_1.offersByTypes.brand && existingOffersBy !== offers_1.offersByTypes.category) {
        return true;
    }
    if (currentOffersBy === offers_1.offersByTypes.product && ![offers_1.offersByTypes.category, offers_1.offersByTypes.brand].includes(existingOffersBy)) {
        return true;
    }
    return false;
}
exports.shouldUpdateOffer = shouldUpdateOffer;
