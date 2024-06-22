import { FilterOptionsProps, frontendPagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import LanguagesModel from '../../../model/admin/setup/language-model';
import CustomerWishlistModel, { CustomerWishlistModelProps } from '../../../model/frontend/customer-wishlist-model';
import { offerBrandPopulation, offerProductPopulation } from '../../../utils/config/offer-config';
import { productCategoryLookup, productLookup } from '../../../utils/config/product-config';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistOfferBrandPopulation, wishlistOfferCategory, wishlistOfferProductPopulation, wishlistProductCategoryLookup } from '../../../utils/config/wishlist-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import commonService from '../guest/common-service';


class CustomerWishlistCountryService {
    async findAll(options: FilterOptionsProps = {}): Promise<CustomerWishlistModelProps[]> {
        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

        const { pipeline: offerPipeline, getOfferList, offerApplied } = await commonService.findOffers(0, hostName);

        let pipeline: any[] = [
            productLookup,
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            productVariantsLookupValues,
            { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            wishlistProductCategoryLookup,
            multilanguageFieldsLookup(languageId),
            { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
            replaceProductLookupValues,
            { $unset: "productDetails.languageValues" },
            { $match: query },

            { $sort: finalSort },
        ];
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = wishlistOfferProductPopulation   (getOfferList, offerApplied.product)
            pipeline.push(offerProduct)

        } else if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = wishlistOfferBrandPopulation(getOfferList, offerApplied.brand)

            pipeline.push(offerBrand);
        } else if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = wishlistOfferCategory(getOfferList, offerApplied.category)
            pipeline.push(offerCategory);
        }

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }

        return CustomerWishlistModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CustomerWishlistModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of wishlists products');
        }
    }
    async create(wishlistData: any): Promise<CustomerWishlistModelProps> {
        return CustomerWishlistModel.create(wishlistData);
    }

    async findOneById(wishlistId: string): Promise<CustomerWishlistModelProps | null> {
        return CustomerWishlistModel.findById(wishlistId);
    }

    async findOne(query: any): Promise<CustomerWishlistModelProps | null> {
        return CustomerWishlistModel.findOne(query);
    }

    async update(wishlistId: string, wishlistData: any): Promise<CustomerWishlistModelProps | null> {
        return CustomerWishlistModel.findByIdAndUpdate(wishlistId, wishlistData, { new: true, useFindAndModify: false });
    }

    async destroy(wishlistId: string): Promise<CustomerWishlistModelProps | null> {
        return CustomerWishlistModel.findOneAndDelete({ _id: wishlistId });
    }
    // async create(wishlistData: any, hostName?: any): Promise<CustomerWishlistModelProps> {
    //     const createdWishlist = await CustomerWishlistModel.create(wishlistData);

    //     const languageData = await LanguagesModel.find().exec();
    //     const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

    //     const pipeline: any[] = [
    //         { $match: { _id: createdWishlist._id } },
    //         productLookup,
    //         { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    //         productVariantsLookupValues,
    //         { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
    //         multilanguageFieldsLookup(languageId),
    //         { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
    //         replaceProductLookupValues,
    //         { $unset: "productDetails.languageValues" },
    //         { $limit: 1 }
    //     ];

    //     const result = await CustomerWishlistModel.aggregate(pipeline).exec();
    //     return result.length > 0 ? result[0] : createdWishlist;
    // }

    // async findOneById(wishlistId: string): Promise<CustomerWishlistModelProps | null> {
    //     return CustomerWishlistModel.findById(wishlistId);
    // }

    // async findOne(query: any): Promise<CustomerWishlistModelProps | null> {
    //     const { hostName, ...matchQuery } = query;

    //     const languageData = await LanguagesModel.find().exec();
    //     const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

    //     let pipeline: any[] = [
    //         { $match: matchQuery },
    //         productLookup,
    //         { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    //         productVariantsLookupValues,
    //         { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
    //         multilanguageFieldsLookup(languageId),
    //         { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
    //         replaceProductLookupValues,
    //         { $unset: "productDetails.languageValues" },
    //         { $limit: 1 }
    //     ];

    //     const result = await CustomerWishlistModel.aggregate(pipeline).exec();
    //     return result.length > 0 ? result[0] : null;
    // }

    // async update(wishlistId: string, wishlistData: any): Promise<CustomerWishlistModelProps | null> {
    //     return CustomerWishlistModel.findByIdAndUpdate(wishlistId, wishlistData, { new: true, useFindAndModify: false });
    // }

    // async destroy(wishlistId: string): Promise<CustomerWishlistModelProps | null> {
    //     return CustomerWishlistModel.findOneAndDelete({ _id: wishlistId });
    // }
}

export default new CustomerWishlistCountryService();
