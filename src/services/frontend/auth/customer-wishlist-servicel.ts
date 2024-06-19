import { FilterOptionsProps, frontendPagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import LanguagesModel from '../../../model/admin/setup/language-model';
import CustomerWishlistModel, { CustomerWishlistModelProps } from '../../../model/frontend/customer-wishlist-model';
import { productLookup } from '../../../utils/config/product-config';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues } from '../../../utils/config/wishlist-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';


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

        let pipeline: any[] = [
            productLookup,
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            productVariantsLookupValues,
            { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            multilanguageFieldsLookup(languageId),
            { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
            replaceProductLookupValues,
            { $unset: "productDetails.languageValues" },
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];

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
}

export default new CustomerWishlistCountryService();
