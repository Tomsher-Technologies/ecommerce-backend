import { offerTypes, offersByTypes } from "../../constants/offers";

export function calculateOfferPrice(offerType: string, offerIN: number, basePrice: number): number {
    if (offerType === offerTypes.percent) {
        return basePrice - (basePrice * (offerIN / 100));
    } else if (offerType === offerTypes.amountOff) {
        return basePrice - offerIN;
    }
    return basePrice;
}

export function shouldUpdateOffer(currentOffersBy: string, existingOffersBy?: string): boolean {
    if (!existingOffersBy) return true;

    if (currentOffersBy === offersByTypes.brand && existingOffersBy !== offersByTypes.category) {
        return true;
    }

    if (currentOffersBy === offersByTypes.product && ![offersByTypes.category, offersByTypes.brand].includes(existingOffersBy)) {
        return true;
    }

    return false;
}