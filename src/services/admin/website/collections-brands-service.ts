import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CollectionsBrandsModel, { CollectionsBrandsProps } from '../../../model/admin/website/collections-brands-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import { collectionsBrandLookup } from '../../../utils/config/collections-brands-config';

class CollectionsBrandsService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<CollectionsBrandsProps[]> {
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

            collectionsBrandLookup

        ];

        return CollectionsBrandsModel.aggregate(pipeline).exec();
    }

    async findUnCollectionedBrands(brandIds: any[]) {
        try {
            const query = { _id: { $nin: brandIds } };

            const unCollectionedBrands = await BrandsModel.find(query).select('_id brandTitle slug description brandImageUrl status');

            return unCollectionedBrands;
        } catch (error) {
            console.error('Error in findUnCollectionedBrands:', error);
            throw error;
        }
    }

    async findCollectionBrands(brandIds: any[]) {
        try {
            const query = { _id: { $in: brandIds } };

            const brands = await BrandsModel.find(query).select('_id brandTitle slug description brandImageUrl status');

            const sortedBrands = brandIds.map(id => brands.find(brand => brand._id.toString() === id.toString()));

            return sortedBrands.filter(brand => brand !== undefined);
        } catch (error) {
            console.error('Error in findCollectionBrands:', error);
            throw error;
        }
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CollectionsBrandsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of collections brands');
        }
    }

    async create(collectionsBrandData: any): Promise<CollectionsBrandsProps | null> {
        const createdCollections = await CollectionsBrandsModel.create(collectionsBrandData);

        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collectionsBrandLookup
            ];

            const createdCollectionsWithValues = await CollectionsBrandsModel.aggregate(pipeline);

            return createdCollectionsWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(collectionsBrandId: string): Promise<CollectionsBrandsProps | null> {
        const collectionsBrandData = await CollectionsBrandsModel.findById(collectionsBrandId);

        if (collectionsBrandData) {
            const pipeline = [
                { $match: { _id: collectionsBrandData._id } },
                collectionsBrandLookup
            ];

            const collectionsBrandDataWithValues = await CollectionsBrandsModel.aggregate(pipeline);

            return collectionsBrandDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(collectionsBrandId: string, collectionsBrandData: any): Promise<CollectionsBrandsProps | null> {
        const updatedCollectionsBrand = await CollectionsBrandsModel.findByIdAndUpdate(
            collectionsBrandId,
            collectionsBrandData,
            { new: true, useFindAndModify: false }
        );
        if (updatedCollectionsBrand) {
            const pipeline = [
                { $match: { _id: updatedCollectionsBrand._id } },
                collectionsBrandLookup
            ];

            const updatedCollectionsBrandWithValues = await CollectionsBrandsModel.aggregate(pipeline);

            return updatedCollectionsBrandWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(collectionsBrandId: string): Promise<CollectionsBrandsProps | null> {
        return CollectionsBrandsModel.findOneAndDelete({ _id: collectionsBrandId });
    }
}

export default new CollectionsBrandsService();
