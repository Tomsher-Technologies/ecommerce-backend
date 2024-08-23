import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import GalleryImageModel, { GalleryImagesProps } from '../../../model/admin/website/gallery-image-model';


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

    async findOne(id: string): Promise<GalleryImagesProps | null> {
        if (id) {
            const objectId = new mongoose.Types.ObjectId(id);
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

}

export default new GalleryImageService();
