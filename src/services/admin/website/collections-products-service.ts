import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collectionsProductLookup } from '../../../utils/config/collections-product-config';

import CollectionsProductsModel, { CollectionsProductsProps } from '../../../model/admin/website/collections-products-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';

class CollectionsProductsService {
    constructor() {}

    async findAll(options: FilterOptionsProps = {}): Promise<CollectionsProductsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },

            collectionsProductLookup,

        ];

        return CollectionsProductsModel.aggregate(pipeline).exec();
    }

    async findUnCollectionedProducts(productIds: any[]) {
        try {
            const query = { _id: { $nin: productIds } };

            const unCollectionedProducts = await ProductsModel.find(query).select('_id productTitle slug description productImageUrl status');

            return unCollectionedProducts;
        } catch (error) {
            console.error('Error in findUnCollectionedProducts:', error);
            throw error;
        }
    }

    async findCollectionProducts(productIds: any[]) {
        try {
            const query = { _id: { $in: productIds } };

            const products = await ProductsModel.find(query).select('_id productTitle slug description productImageUrl status');

            return products;
        } catch (error) {
            console.error('Error in findCollectionProducts:', error);
            throw error;
        }
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CollectionsProductsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of collections products');
        }
    }

    async create(collectionsProductData: any): Promise<CollectionsProductsProps | null> {
        const createdCollections = await CollectionsProductsModel.create(collectionsProductData);

        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collectionsProductLookup,
            ];

            const createdCollectionsWithValues = await CollectionsProductsModel.aggregate(pipeline);

            return createdCollectionsWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(collectionsProductId: string): Promise<CollectionsProductsProps | null> {
        const collectionsProductData = await CollectionsProductsModel.findById(collectionsProductId);

        if (collectionsProductData) {
            const pipeline = [
                { $match: { _id: collectionsProductData._id } },
                collectionsProductLookup,
            ];

            const collectionsProductDataWithValues = await CollectionsProductsModel.aggregate(pipeline);

            return collectionsProductDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(collectionsProductId: string, collectionsProductData: any): Promise<CollectionsProductsProps | null> {
        const updatedCollectionsProduct = await CollectionsProductsModel.findByIdAndUpdate(
            collectionsProductId,
            collectionsProductData,
            { new: true, useFindAndModify: false }
        );
        if (updatedCollectionsProduct) {
            const pipeline = [
                { $match: { _id: updatedCollectionsProduct._id } },
                collectionsProductLookup,
            ];

            const updatedCollectionsProductWithValues = await CollectionsProductsModel.aggregate(pipeline);

            return updatedCollectionsProductWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(collectionsProductId: string): Promise<CollectionsProductsProps | null> {
        return CollectionsProductsModel.findOneAndDelete({ _id: collectionsProductId });
    }
}

export default new CollectionsProductsService();
