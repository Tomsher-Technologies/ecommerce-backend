import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import SliderModel, { SliderProps } from '../../../model/admin/ecommerce/slider-model';
import { sliderLookup, sliderProject } from '../../../utils/config/slider-config';

class SliderService {

    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<SliderProps[]> {
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

            sliderLookup,
            sliderProject
        ];

        return SliderModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await SliderModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of sliders');
        }
    }

    async create(sliderData: any): Promise<any> {
        const createdSlider = await SliderModel.create(sliderData);

        if (createdSlider) {
            const pipeline = [
                { $match: { _id: createdSlider._id } },
                sliderLookup,
                sliderProject
            ];

            const createdSliderWithValues = await SliderModel.aggregate(pipeline);

            return createdSliderWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(sliderId: string): Promise<SliderProps | null> {
        if (sliderId) {
            const objectId = new mongoose.Types.ObjectId(sliderId);
            const pipeline = [
                { $match: { _id: objectId } },
                sliderLookup,
                sliderProject
            ];

            const sliderDataWithValues = await SliderModel.aggregate(pipeline);

            return sliderDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(sliderId: string, sliderData: any): Promise<SliderProps | null> {
        const updatedSlider = await SliderModel.findByIdAndUpdate(
            sliderId,
            sliderData,
            { new: true, useFindAndModify: false }
        );

        if (updatedSlider) {
            const pipeline = [
                { $match: { _id: updatedSlider._id } },
                sliderLookup,
                sliderProject
            ];

            const updatedSliderWithValues = await SliderModel.aggregate(pipeline);

            return updatedSliderWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(sliderId: string): Promise<SliderProps | null> {
        return SliderModel.findOneAndDelete({ _id: sliderId });
    }
}

export default new SliderService();
