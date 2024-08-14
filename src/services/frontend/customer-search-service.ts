import mongoose from 'mongoose';
import { collections } from '../../constants/collections';
import ProductsModel from '../../model/admin/ecommerce/product-model';
import { brandLookup, brandObject, productCategoryLookup, productProject } from '../../utils/config/product-config';
import { ProductsProps } from '../../utils/types/products';
import { frontendPagination } from '../../components/pagination';


class CustomerSearchService {
    async customerSearch(productOption: any): Promise<ProductsProps[]> {
        var { query, countryId, getbrand = '1', sort } = productOption;
        const { skip, limit } = frontendPagination(productOption.query || {}, productOption);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
            },
            status: "1"
        };
        const modifiedPipeline = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    { $match: variantLookupMatch },
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            productId: 1,
                            extraProductTitle: 1,
                        }
                    },
                ]
            }
        };

        let pipeline: any[] = [
            { $sort: finalSort },
            { $skip: skip },
            { $limit: limit },
            modifiedPipeline,
            productCategoryLookup,
            ...(getbrand === '1' ? [brandLookup, brandObject] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
        ];

        let productData: any = [];
        pipeline.push({
            $project: {
                _id: 1,
                productTitle: 1,
                brand: 1,
                productCategory: {
                    $ifNull: ['$productCategory', []]
                },
                productVariants: {
                    $ifNull: ['$productVariants', []]
                },

            }
        });
        productData = await ProductsModel.aggregate(pipeline).exec();
        return productData;
    }

}

export default new CustomerSearchService();