import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';

import GalleryImageModel, { GalleryImagesProps } from '../../../model/admin/website/gallery-image-model';
import { capitalizeWords, slugify } from '../../../utils/helpers';


class GalleryImageService {

    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<GalleryImagesProps[]> {
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

        ];

        return GalleryImageModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await GalleryImageModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of brands');
        }
    }

    async create(data: any): Promise<GalleryImagesProps | null> {
        const created = await GalleryImageModel.create(data);

        if (created) {
            const pipeline = [
                { $match: { _id: created._id } },
            ];

            const createdBrandWithValues = await GalleryImageModel.aggregate(pipeline);

            return createdBrandWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(brandId: string): Promise<GalleryImagesProps | null> {
        if (brandId) {
            const objectId = new mongoose.Types.ObjectId(brandId);
            const pipeline = [
                { $match: { _id: objectId } },
            ];

            const brandDataWithValues = await GalleryImageModel.aggregate(pipeline);

            return brandDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(brandId: string, brandData: any): Promise<GalleryImagesProps | null> {
        const updatedBrand = await GalleryImageModel.findByIdAndUpdate(
            brandId,
            brandData,
            { new: true, useFindAndModify: false }
        );

        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
            ];

            const updatedBrandWithValues = await GalleryImageModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(brandId: string): Promise<GalleryImagesProps | null> {
        return GalleryImageModel.findOneAndDelete({ _id: brandId });
    }
    async findBrand(data: any): Promise<GalleryImagesProps | null> {
        return GalleryImageModel.findOne(data);
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


    async updateWebsitePriority(container1: any[] | undefined, columnKey: keyof GalleryImagesProps): Promise<void> {
        try {
            // Set columnKey to '0' for all documents initially
            await GalleryImageModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const brandId = container1[i];
                    const brand = await GalleryImageModel.findById(brandId);
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

export default new GalleryImageService();
