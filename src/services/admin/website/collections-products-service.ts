import { FilterOptionsProps, pagination } from '@components/pagination';

import CollectionsProductsModel, { CollectionsProductsProps } from '@model/admin/website/collections-products-model';
import ProductsModel from '@model/admin/ecommerce/products-model';

class CollectionsProductsService {
    async findAll(options: FilterOptionsProps = {}): Promise<CollectionsProductsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = CollectionsProductsModel.find(query)
            .skip(skip)
            .limit(limit)
            .lean();

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }

    async findUnCollectionedProducts(productIds: any[]) {
        try {
            const query = { _id: { $nin: productIds } };

            const unCollectionedProducts = await ProductsModel.find(query).select('_id en_productTitle ar_productTitle slug description productImageUrl status');

            return unCollectionedProducts;
        } catch (error) {
            console.error('Error in findUnCollectionedProducts:', error);
            throw error;
        }
    }

    async findCollectionProducts(productIds: any[]) {
        try {
            const query = { _id: { $in: productIds } };

            const products = await ProductsModel.find(query).select('_id en_productTitle ar_productTitle slug description productImageUrl status');

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

    async create(collectionsProductData: any): Promise<CollectionsProductsProps> {
        return CollectionsProductsModel.create(collectionsProductData);
    }

    async findOne(collectionsProductId: string): Promise<CollectionsProductsProps | null> {
        return CollectionsProductsModel.findById(collectionsProductId);
    }

    async update(collectionsProductId: string, collectionsProductData: any): Promise<CollectionsProductsProps | null> {
        return CollectionsProductsModel.findByIdAndUpdate(collectionsProductId, collectionsProductData, { new: true, useFindAndModify: false });
    }

    async destroy(collectionsProductId: string): Promise<CollectionsProductsProps | null> {
        return CollectionsProductsModel.findOneAndDelete({ _id: collectionsProductId });
    }
}

export default new CollectionsProductsService();
