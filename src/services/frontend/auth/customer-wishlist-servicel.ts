import { FilterOptionsProps, frontendPagination } from '../../../components/pagination';
import LanguagesModel from '../../../model/admin/setup/language-model';
import CustomerWishlistModel, { CustomerWishlistModelProps } from '../../../model/frontend/customer-wishlist-model';
import { productLookup, productMultilanguageFieldsLookup, variantLookup } from '../../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import ProductService from '../guest/product-service';



class CustomerWishlistCountryService {
    async findAll(options: FilterOptionsProps = {}): Promise<CustomerWishlistModelProps[]> {
        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            productLookup,
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: `productvariants`,
                    let: { productId: "$productDetails._id", variantId: "$variantId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$variantId"] } } }
                    ],
                    as: "productDetails.variantDetails"
                }
            },
            { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData);
        console.log(hostName, 'languageId', languageId);

        if (languageId) {

            const productLookupWithLanguage = {
                ...productMultilanguageFieldsLookup,
                $lookup: {
                    ...productMultilanguageFieldsLookup.$lookup,
                    pipeline: productMultilanguageFieldsLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(productLookupWithLanguage);

            //     // pipeline.push(productlanguageFieldsReplace);

            //     // pipeline.push(productDetailLanguageFieldsReplace)

        }

        // const language: any = await ProductService.productLanguage(hostName, pipeline)

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
