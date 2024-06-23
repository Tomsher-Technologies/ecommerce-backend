"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const multi_languages_1 = require("../../../constants/multi-languages");
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const helpers_1 = require("../../../utils/helpers");
class CategoryService {
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
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.categories] },
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
        };
    }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            this.multilanguageFieldsLookup,
            this.project
        ];
        return category_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await category_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of categories');
        }
    }
    async populateParentCategories(category) {
        if (category.parentCategory) {
            try {
                const parentCategory = await category_model_1.default.findById(category.parentCategory);
                if (parentCategory) {
                    category.parentCategory = await this.populateParentCategories(parentCategory);
                }
            }
            catch (error) {
                console.error(`Error finding parent category: ${error}`);
            }
        }
        return category;
    }
    async findAllParentCategories(options = {}) {
        const { query } = (0, pagination_1.pagination)(options.query || {}, options);
        let categories = await category_model_1.default.find(query)
            .populate('parentCategory', 'categoryTitle')
            .lean();
        categories = await Promise.all(categories.map(async (category) => {
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
    async findAllChilledCategories(query) {
        try {
            const rootCategories = await category_model_1.default.find(query); // Find root categories
            if (!rootCategories || rootCategories.length === 0) {
                return null;
            }
            const categoriesWithSubcategories = [];
            for (const rootCategory of rootCategories) {
                const processedCategory = await this.processCategory(rootCategory);
                categoriesWithSubcategories.push(processedCategory);
            }
            return categoriesWithSubcategories;
        }
        catch (error) {
            console.error("Error finding categories:", error);
            return null;
        }
    }
    async processCategory(category) {
        const subcategories = await category_model_1.default.find({ parentCategory: category._id });
        if (subcategories && subcategories.length > 0) {
            const processedSubcategories = [];
            for (const subcategory of subcategories) {
                const processedSubcategory = await this.processCategory(subcategory);
                processedSubcategories.push(processedSubcategory);
            }
            return { ...category.toObject(), subCategories: processedSubcategories };
        }
        else {
            return { ...category.toObject(), subCategories: [] };
        }
    }
    async findSubCategory(category) {
        const findCategories = await this.getParentChilledCategory({ parentCategory: category._id });
        const categoriesWithSubcategories = [];
        if (findCategories) {
            for (let i = 0; i < findCategories.length; i++) {
                const data = {
                    level: parseInt(category.level) + 1,
                    slug: (0, helpers_1.slugify)(category.slug + "-" + findCategories[i].categoryTitle)
                };
                const query = findCategories[i]._id;
                const categories = await this.update(query, data);
                const result = await this.findSubCategory(categories);
                categoriesWithSubcategories.push(result);
            }
        }
    }
    async getParentChilledCategory(query) {
        return category_model_1.default.find(query);
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
    async create(categoryData) {
        const createdCategory = await category_model_1.default.create(categoryData);
        if (createdCategory) {
            const pipeline = [
                { $match: { _id: createdCategory._id } },
                this.multilanguageFieldsLookup,
                this.parentCategoryLookup,
                this.project
            ];
            const createdCategoryWithValues = await category_model_1.default.aggregate(pipeline);
            return createdCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(categoryId) {
        try {
            if (categoryId) {
                const objectId = new mongoose_1.default.Types.ObjectId(categoryId);
                const pipeline = [
                    { $match: { _id: objectId } },
                    this.multilanguageFieldsLookup,
                ];
                const categoryDataWithValues = await category_model_1.default.aggregate(pipeline);
                return categoryDataWithValues[0] || null;
            }
            else {
                return null;
            }
        }
        catch (error) {
            return null;
        }
    }
    async findOneCategory(data) {
        return category_model_1.default.findOne(data);
    }
    // async findCategoryId(categoryTitle: string): Promise<void | null> {
    //     const slug = slugify(categoryTitle)
    //     const categoryResult: any = await this.findOneCategory({ slug: slug });
    //     if (categoryResult) {
    //         return categoryResult
    //     }
    //     else {
    //         const catData = categoryTitle.split('-');
    //         let slug: any
    //         for (let data = 0; data < catData.length; data++) {
    //             if (slug == undefined) {
    //                 slug = catData[data]
    //                 const categoryResult: any = await this.findOneCategory({ slug: slug });
    //                 if (!categoryResult) {
    //                     const categoryData = {
    //                         categoryTitle:capitalizeWords(categoryTitle),
    //                         slug: slugify(categoryTitle),
    //                         parentCategory: null,
    //                         level: '0',
    //                         isExcel: true
    //                     }
    //                     await this.create(categoryData);
    //                 }
    //             }
    //             else {
    //                 slug = slug + "-" + catData[data]
    //                 const categoryResult: any = await this.findOneCategory({ slug: slug });
    //                 if (categoryResult) {
    //                 }
    //                 else {
    //                     var titleData = slug.split('-')
    //                     const lastItem = titleData[titleData.length - 1];
    //                     titleData.pop();
    //                     const resultString = titleData.join('-');
    //                     const result: any = await this.findOneCategory({ slug: resultString });
    //                     const categoryData = {
    //                         categoryTitle:capitalizeWords(lastItem),
    //                         slug: slugify(slug),
    //                         parentCategory: result._id,
    //                         level: titleData.length.toString(),
    //                         isExcel: true
    //                     }
    //                     await this.create(categoryData);
    //                 }
    //             }
    //             const categoryResult: any = await this.findOneCategory({ slug: slugify(categoryTitle) })
    //             if (categoryResult) {
    //                 return categoryResult
    //             }
    //         }
    //     }
    // }
    // async findOne(categoryId: string): Promise<CategoryProps | null> {
    //     return CategoryModel.findById(categoryId);
    // }
    async findCategoryId(categoryTitle) {
        const slug = (0, helpers_1.slugify)(categoryTitle);
        let categoryResult = await this.findOneCategory({ slug: slug });
        if (categoryResult) {
            return categoryResult;
        }
        else {
            // const catData = slug.split(/([^-]+)/g);
            function splitHyphenOutsideParentheses(inputStr) {
                // Regular expression to split by hyphens not inside parentheses
                const parts = inputStr.split(/-(?![^()]*\))/);
                return parts;
            }
            // Example usage
            const inputData = "Infant-Baby Girl (6-36M)-Dresses";
            const catData = splitHyphenOutsideParentheses(categoryTitle);
            console.log(".....sdsd.....", categoryTitle);
            console.log(".....sdsd.....", catData);
            let currentSlug = '';
            for (const data of catData) {
                if (currentSlug !== '') {
                    currentSlug += '-';
                }
                currentSlug += (0, helpers_1.slugify)(data);
                // console.log("fvdgdfgsd",currentSlug);
                categoryResult = await this.findOneCategory({ slug: currentSlug });
                if (categoryResult == null) {
                    const titleData = currentSlug.split('-');
                    const lastItem = titleData[titleData.length - 1];
                    titleData.pop();
                    const parentSlug = titleData.join('-');
                    const parentCategory = await this.findOneCategory({ slug: parentSlug });
                    console.log();
                    const categoryData = {
                        categoryTitle: (0, helpers_1.capitalizeWords)(lastItem),
                        slug: (0, helpers_1.slugify)(currentSlug),
                        parentCategory: parentCategory ? parentCategory._id : null,
                        level: parentCategory ? titleData.length.toString() : '0',
                        isExcel: true
                    };
                    await this.create(categoryData);
                }
            }
            const result = await this.findOneCategory({ slug: (0, helpers_1.slugify)(categoryTitle) });
            if (result) {
                return result;
            }
        }
    }
    async findParentCategory(parentCategory) {
        return category_model_1.default.findOne({ _id: parentCategory });
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
    async update(categoryId, categoryData) {
        const updatedCategory = await category_model_1.default.findByIdAndUpdate(categoryId, categoryData, { new: true, useFindAndModify: false });
        if (updatedCategory) {
            const pipeline = [
                { $match: { _id: updatedCategory._id } },
                this.multilanguageFieldsLookup,
            ];
            const updatedCategoryWithValues = await category_model_1.default.aggregate(pipeline);
            return updatedCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(categoryId) {
        return category_model_1.default.findOneAndDelete({ _id: categoryId });
    }
    async updateWebsitePriority(container1, columnKey) {
        try {
            // Set columnKey to '0' for all documents initially
            await category_model_1.default.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });
            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const categoryId = container1[i];
                    const category = await category_model_1.default.findById(categoryId);
                    if (category) {
                        category[columnKey] = (i + 1).toString();
                        await category.save({ validateBeforeSave: false });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}
exports.default = new CategoryService();
