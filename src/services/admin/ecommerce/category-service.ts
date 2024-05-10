import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';
import categoryController from '../../../controllers/admin/ecommerce/category-controller';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import { pipeline } from 'stream';


class CategoryService {

    private parentCategoryLookup: any;
    private multilanguageFieldsLookup: any;
    private graphLookUp: any;
    private project: any;
    constructor() {

        this.graphLookUp = {
            $graphLookup: {
                from: 'categories',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parentCategory',
                as: 'subCategories',
                maxDepth: 10, // Specify the maximum depth
                depthField: 'level', // Optional, if you want to track the depth

            }
        };
        this.parentCategoryLookup = {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: 'parentCategory',
                as: 'subCategories',

                pipeline: [
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: 'parentCategory',
                            as: 'subCategories',
                        },
                    },
                ],
            }
        };
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { categoryId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$categoryId'] },
                                    { $eq: ['$source', multiLanguageSources.ecommerce.categories] },
                                ],
                            },
                        },
                    },
                ],
                as: 'languageValues',
            },
        };

        this.project = {
            $project: {
                _id: 1,
                categoryTitle: 1,
                slug: 1,
                description: 1,
                categoryImageUrl: 1,
                parentCategory: 1,
                corporateGiftsPriority: 1,
                type: 1,
                level: 1,
                status: 1,
                createdAt: 1,
                subCategories: {
                    $ifNull: ['$subCategories', []]
                },
                languageValues: { $ifNull: ['$languageValues', []] },
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {
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

            this.multilanguageFieldsLookup,

            this.project
        ];

        return CategoryModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CategoryModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of categories');
        }
    }

    async populateParentCategories(category: any): Promise<any> {
        if (category.parentCategory) {
            try {
                const parentCategory = await CategoryModel.findById(category.parentCategory);
                if (parentCategory) {
                    category.parentCategory = await this.populateParentCategories(parentCategory);
                }
            } catch (error) {
                console.error(`Error finding parent category: ${error}`);
            }
        }
        return category;
    }

    async findAllParentCategories(options: FilterOptionsProps = {}): Promise<any[]> {
        const { query } = pagination(options.query || {}, options);

        let categories: any = await CategoryModel.find(query)
            .populate('parentCategory', 'categoryTitle')
            .lean();
        categories = await Promise.all(categories.map(async (category: any) => {
            category = await this.populateParentCategories(category);
            return category;
        }));
        return categories;
    }

    // async findAllCategories(): Promise<CategoryProps[] | null> {
    //     try {
    //         const pipeline = [
    //             {
    //                 $match: { parentCategory: { $exists: false } } // Find root categories
    //             },
    //             {
    //                 $graphLookup: {
    //                     from: "categories",
    //                     startWith: "$_id",
    //                     connectFromField: "_id",
    //                     connectToField: "parentCategory",
    //                     as: "subCategories",
    //                     maxDepth: 1 // Limit depth to 1 level
    //                 }
    //             },
    //             {
    //                 $addFields: {
    //                     subCategories: {
    //                         $map: {
    //                             input: "$subCategories",
    //                             as: "subcategory",
    //                             in: {
    //                                 $mergeObjects: [
    //                                     "$$subcategory",
    //                                     {
    //                                         subCategories: [] // Empty array to limit to one level
    //                                     }
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         ];

    //         const categoriesWithSubcategories = await CategoryModel.aggregate(pipeline);
    //         return categoriesWithSubcategories;
    //     } catch (error) {
    //         console.error("Error finding categories:", error);
    //         return null;
    //     }
    // }




    async findAllChilledCategories(query: any): Promise<CategoryProps[] | null> {
        try {
            const rootCategories = await CategoryModel.find(query); // Find root categories
            if (!rootCategories || rootCategories.length === 0) {
                return null;
            }

            const categoriesWithSubcategories: CategoryProps[] = [];
            for (const rootCategory of rootCategories) {
                const processedCategory = await this.processCategory(rootCategory);
                categoriesWithSubcategories.push(processedCategory);
            }

            return categoriesWithSubcategories;
        } catch (error) {
            console.error("Error finding categories:", error);
            return null;
        }
    }

    async processCategory(category: any): Promise<any> {
        const subcategories: any = await CategoryModel.find({ parentCategory: category._id });
        if (subcategories && subcategories.length > 0) {
            const processedSubcategories: CategoryProps[] = [];
            for (const subcategory of subcategories) {
                const processedSubcategory = await this.processCategory(subcategory);
                processedSubcategories.push(processedSubcategory);
            }
            return { ...category.toObject(), subCategories: processedSubcategories };
        } else {
            return { ...category.toObject(), subCategories: [] };
        }
    }


    async getParentChilledCategory(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {
        const { query } = pagination(options.query || {}, options);
        return CategoryModel.find(query);
    }
    // async findCategory(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {
    //     const { query, skip, limit, sort } = pagination(options.query || {}, options);
    //     const defaultSort = { createdAt: -1 };
    //     let finalSort = sort || defaultSort;
    //     const sortKeys = Object.keys(finalSort);
    //     if (sortKeys.length === 0) {
    //         finalSort = defaultSort;
    //     }

    //     let pipeline: any[] =[{ $project: { parentCategory: 1 } }]

    //     return CategoryModel.aggregate(pipeline).exec();
    // }

    async create(categoryData: any): Promise<CategoryProps | null> {
        const createdCategory = await CategoryModel.create(categoryData);
        if (createdCategory) {
            const pipeline = [
                { $match: { _id: createdCategory._id } },
                this.multilanguageFieldsLookup,
                this.parentCategoryLookup,
                this.project
            ];

            const createdCategoryWithValues = await CategoryModel.aggregate(pipeline);

            return createdCategoryWithValues[0];
        } else {
            return null;
        }
    }


    async findOne(categoryId: string): Promise<CategoryProps | null> {
        try {
            if (categoryId) {
                const objectId = new mongoose.Types.ObjectId(categoryId);

                const pipeline = [
                    { $match: { _id: objectId } },
                    this.multilanguageFieldsLookup,
                ];

                const categoryDataWithValues = await CategoryModel.aggregate(pipeline);

                return categoryDataWithValues[0] || null;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }




    // async findOne(categoryId: string): Promise<CategoryProps | null> {
    //     return CategoryModel.findById(categoryId);

    // }

    async findParentCategory(parentCategory: string): Promise<CategoryProps | null> {
        return CategoryModel.findOne({ _id: parentCategory });
    }

    // async findAllCategories(): Promise<CategoryProps | null> {

    //     const pipeline = [
    //         this.parentCategoryLookup
    //     ];

    //     const categoryDataWithValues: any = await CategoryModel.aggregate(pipeline).match({ level: "0" });
    //     if (categoryDataWithValues) {
    //         return categoryDataWithValues
    //     } else {
    //         return null
    //     }


    // }

    async update(categoryId: string, categoryData: any): Promise<CategoryProps | null> {
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            categoryId,
            categoryData,
            { new: true, useFindAndModify: false }
        );

        if (updatedCategory) {
            const pipeline = [
                { $match: { _id: updatedCategory._id } },
                this.multilanguageFieldsLookup,
            ];

            const updatedCategoryWithValues = await CategoryModel.aggregate(pipeline);

            return updatedCategoryWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(categoryId: string): Promise<CategoryProps | null> {
        return CategoryModel.findOneAndDelete({ _id: categoryId });
    }

    async updateWebsitePriority(container1: any[] | undefined, columnKey: keyof CategoryProps): Promise<void> {
        try {
            // Set columnKey to '0' for all documents initially
            await CategoryModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const categoryId = container1[i];
                    const category = await CategoryModel.findById(categoryId);
                    if (category) {
                        (category as any)[columnKey] = (i + 1).toString();
                        await category.save({ validateBeforeSave: false });
                    }
                }
            }
        } catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}

export default new CategoryService();
