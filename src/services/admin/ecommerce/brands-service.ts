import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multilanguagefieledsBrandLookup } from '../../../utils/config/brand-config';
import { seoLookup } from '../../../utils/config/common-config';
import { capitalizeWords, slugify } from '../../../utils/helpers';

import BrandsModel, { BrandProps } from '../../../model/admin/ecommerce/brands-model';


class BrandsService {

    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<BrandProps[]> {
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
            seoLookup('brandSeo'),
            multilanguagefieledsBrandLookup,
        ];

        return BrandsModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await BrandsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of brands');
        }
    }

    async create(brandData: any): Promise<BrandProps | null> {
        const createdBrand = await BrandsModel.create(brandData);

        if (createdBrand) {
            const pipeline = [
                { $match: { _id: createdBrand._id } },
                multilanguagefieledsBrandLookup,
            ];

            const createdBrandWithValues = await BrandsModel.aggregate(pipeline);

            return createdBrandWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(brandId: string): Promise<BrandProps | null> {
        if (brandId) {
            const objectId = new mongoose.Types.ObjectId(brandId);
            const pipeline = [
                { $match: { _id: objectId } },
                multilanguagefieledsBrandLookup,
            ];

            const brandDataWithValues = await BrandsModel.aggregate(pipeline);

            return brandDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(brandId: string, brandData: any): Promise<BrandProps | null> {
        const updatedBrand = await BrandsModel.findByIdAndUpdate(
            brandId,
            brandData,
            { new: true, useFindAndModify: false }
        );

        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                multilanguagefieledsBrandLookup,
            ];

            const updatedBrandWithValues = await BrandsModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(brandId: string): Promise<BrandProps | null> {
        return BrandsModel.findOneAndDelete({ _id: brandId });
    }
    async findBrand(data: any): Promise<BrandProps | null> {
        return BrandsModel.findOne(data);
    }
    async findBrandId(brandTitle: string): Promise<void | null> {
        const slug = slugify(brandTitle);

        const resultBrand: any = await this.findBrand({ brandTitle: brandTitle.trim() });
        if (resultBrand) {
            return resultBrand
        } else {
            const brandData = {
                brandTitle: capitalizeWords(brandTitle),
                slug: slugify(brandTitle),
                isExcel: true
            }

            const brandResult: any = await this.create(brandData)
            if (brandResult) {
                return brandResult
            }
        }
    }


    async updateWebsitePriority(container1: any[] | undefined, columnKey: keyof BrandProps): Promise<void> {
        try {
            // Set columnKey to '0' for all documents initially
            await BrandsModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const brandId = container1[i];
                    const brand = await BrandsModel.findById(brandId);
                    if (brand) {
                        (brand as any)[columnKey] = (i + 1).toString();
                        await brand.save({ validateBeforeSave: false });
                    }
                }
            }
        } catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}

export default new BrandsService();
