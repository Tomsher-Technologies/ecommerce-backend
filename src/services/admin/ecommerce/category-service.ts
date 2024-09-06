import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';
import GeneralService from '../../../services/admin/general-service';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import { pipeline } from 'stream';
import { capitalizeWords, categorySlugify, handleFileUpload, slugify } from '../../../utils/helpers';


class CategoryService {

    private parentCategoryLookup: any;
    private multilanguageFieldsLookup: any;
    private project: any;
    constructor() {

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
                categorySecondImageUrl: 1,
                parentCategory: 1,
                corporateGiftsPriority: 1,
                type: 1,
                level: 1,
                status: 1,
                createdAt: 1,
                metaTitle: 1,
                metaKeywords: 1,
                metaDescription: 1,
                metaImageUrl: 1,
                ogTitle: 1,
                ogDescription: 1,
                twitterTitle: 1,
                twitterDescription: 1,
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

    async findAllChilledCategories(query: any): Promise<CategoryProps[] | null> {
        try {
            const rootCategories = await CategoryModel.find(query).select('_id categoryTitle slug parentCategory categoryImageUrl');
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

    async findSubCategory(category: any): Promise<any> {

        const findCategories: any = await this.getParentChilledCategory({ parentCategory: category._id });
        const categoriesWithSubcategories: CategoryProps[] = [];

        if (findCategories) {
            for (let i = 0; i < findCategories.length; i++) {
                const data = {
                    level: parseInt(category.level) + 1,
                    slug: categorySlugify(category.slug + "-" + findCategories[i].categoryTitle)
                }
                const query = findCategories[i]._id

                const categories: any = await this.update(query, data);
                const result: any = await this.findSubCategory(categories)
                categoriesWithSubcategories.push(result);
            }
        }
    }


    async getParentChilledCategory(query: any): Promise<CategoryProps[]> {

        return CategoryModel.find(query);
    }


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

    async findOneCategory(data: any): Promise<CategoryProps | null> {
        return CategoryModel.findOne(data);
    }

    async findCategoryId(categoryTitle: string): Promise<void | any> {

        function createSlug(input: any) {
            return input
                .toLowerCase() // Convert to lowercase
                .replace(/(?<=\d)-(?=\d)/g, '_') // Replace hyphens between numbers with underscores
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .replace(/[^a-z0-9-_]+/g, '') // Remove all non-alphanumeric characters except hyphens and underscores
                .replace(/_+/g, '_') // Replace multiple underscores with a single underscore
                .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        }

        const slug = createSlug(categoryTitle);

        // const slug = categorySlugify(categoryTitle);
        let categoryResult = await this.findOneCategory({ slug: slug });
        if (categoryResult) {
            return categoryResult;
        }
        else {
            function splitHyphenOutsideParentheses(inputStr: any) {
                const parts = inputStr.split(/-(?![^()]*\))/);
                return parts;
            }

            function splitHyphenOutsideParentheses1(inputStr: any) {
                return inputStr
                    .toLowerCase()
                    .replace(/\(([^)]*)\)/g, (match: any, p1: any) => {
                        return `(${p1.replace(/-/g, '_')})`;
                    });
            }

            const categoryTitleData = splitHyphenOutsideParentheses(categoryTitle)
            const catData1 = splitHyphenOutsideParentheses1(categoryTitle);
            const catData = splitHyphenOutsideParentheses(catData1);
            let parentSlug = null
            let currentSlug = '';
            let index = 0;
            for (const data of catData) {
                parentSlug = currentSlug
                if (currentSlug !== '') {
                    currentSlug += '-';
                }
                currentSlug += categorySlugify(data);

                categoryResult = await this.findOneCategory({ slug: currentSlug });
                if (categoryResult == null) {
                    const titleData = splitHyphenOutsideParentheses(data);
                    const lastItem = titleData[titleData.length - 1];
                    const parentCategory = await this.findOneCategory({ slug: parentSlug });
                    parentSlug = currentSlug;

                    const categoryData = {
                        categoryTitle: categoryTitleData[index],
                        slug: categorySlugify(currentSlug),
                        parentCategory: parentCategory ? parentCategory._id : null,
                        level: parentCategory ? Number(parentCategory.level) + 1 : '0',
                        isExcel: true
                    };
                    await this.create(categoryData);
                }
                index++;
            }
            const result: any = await this.findOneCategory({ slug: categorySlugify(categoryTitle) })
            if (result) {
                return result
            }
        }
    }



    async findParentCategory(parentCategory: string): Promise<CategoryProps | null> {
        return CategoryModel.findOne({ _id: parentCategory });
    }


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
            await CategoryModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
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
