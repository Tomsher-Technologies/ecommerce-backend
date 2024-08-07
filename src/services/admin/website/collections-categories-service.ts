import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CollectionsCategoryModel, { CollectionsCategoriesProps } from '../../../model/admin/website/collections-categories-model';
import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import { collectionsCategoryLookup } from '../../../utils/config/collections-categories-config';

class CollectionsCategoriesService {
    constructor() {   }

    async findAll(options: FilterOptionsProps = {}): Promise<CollectionsCategoriesProps[]> {
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

            collectionsCategoryLookup,

        ];

        return CollectionsCategoryModel.aggregate(pipeline).exec();
    }

    async findUnCollectionedCategories(categoryIds: any[]) {
        try {
            const query = { _id: { $nin: categoryIds } };

            const unCollectionedCategories = await CategoryModel.find(query).select('_id categoryTitle slug description categoryImageUrl categorySecondImageUrl status');

            return unCollectionedCategories;
        } catch (error) {
            console.error('Error in findUnCollectionedCategories:', error);
            throw error;
        }
    }

    async findCollectionCategories(categoryIds: any[]) {
        try {
            const query = { _id: { $in: categoryIds } };

            const categories = await CategoryModel.find(query).select('_id categoryTitle slug description categoryImageUrl categorySecondImageUrl status');

            return categories;
        } catch (error) {
            console.error('Error in findCollectionCategories:', error);
            throw error;
        }
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CollectionsCategoryModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of collections categories');
        }
    }

    async create(collectionsCategoryData: any): Promise<CollectionsCategoriesProps | null> {
        const createdCollections = await CollectionsCategoryModel.create(collectionsCategoryData);

        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collectionsCategoryLookup,
            ];

            const createdCollectionsWithValues = await CollectionsCategoryModel.aggregate(pipeline);

            return createdCollectionsWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(collectionsCategoryId: string): Promise<CollectionsCategoriesProps | null> {
        const collectionsCategoryData = await CollectionsCategoryModel.findById(collectionsCategoryId);

        if (collectionsCategoryData) {
            const pipeline = [
                { $match: { _id: collectionsCategoryData._id } },
                collectionsCategoryLookup,
            ];

            const collectionsCategoryDataWithValues = await CollectionsCategoryModel.aggregate(pipeline);

            return collectionsCategoryDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(collectionsCategoryId: string, collectionsCategoryData: any): Promise<CollectionsCategoriesProps | null> {
        const updatedCollectionsCategory = await CollectionsCategoryModel.findByIdAndUpdate(
            collectionsCategoryId,
            collectionsCategoryData,
            { new: true, useFindAndModify: false }
        );
        if (updatedCollectionsCategory) {
            const pipeline = [
                { $match: { _id: updatedCollectionsCategory._id } },
                collectionsCategoryLookup,
            ];

            const updatedCollectionsCategoryWithValues = await CollectionsCategoryModel.aggregate(pipeline);

            return updatedCollectionsCategoryWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(collectionsCategoryId: string): Promise<CollectionsCategoriesProps | null> {
        return CollectionsCategoryModel.findOneAndDelete({ _id: collectionsCategoryId });
    }
}

export default new CollectionsCategoriesService();
