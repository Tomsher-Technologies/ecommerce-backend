import { FilterOptionsProps, pagination } from '../../../components/pagination';

import { multiLanguageSources } from '../../../constants/multi-languages';

import SliderModel, { SliderProps } from '../../../model/admin/ecommerce/slider-model';

class SliderService {

    private lookup: any;
    private project: any;
    constructor() {
        this.lookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { sliderId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$sliderId'] },
                                    { $eq: ['$source', multiLanguageSources.ecommerce.sliders] },
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
                countryId: 1,
                sliderTitle: 1,
                page: 1,
                linkType: 1,
                link: 1,
                description: 1,
                sliderImageUrl: 1,
                position: 1,
                status: 1,
                createdAt: 1,
                languageValues: { $ifNull: ['$languageValues', []] }
            }
        }
    }

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

            this.lookup,

            this.project
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
                this.lookup,
                this.project
            ];

            const createdSliderWithValues = await SliderModel.aggregate(pipeline);

            return createdSliderWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(sliderId: string): Promise<SliderProps | null> {
        if (sliderId) {
            const pipeline = [
                { $match: { _id: sliderId } },
                this.lookup,
                this.project
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
                this.lookup,
                this.project
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
  