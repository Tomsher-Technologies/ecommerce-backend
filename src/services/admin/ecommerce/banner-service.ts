import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';

import BannerModel, { BannerProps } from '../../../model/admin/ecommerce/banner-model';
import { handleFileUpload } from '../../../utils/helpers';
import { pageReference } from '../../../constants/pages';


class BannerService {
    private lookup: any;
    private project: any;
    private sort: any;

    constructor() {
        this.lookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { bannerId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$bannerId'] },
                                    { $eq: ['$source', multiLanguageSources.ecommerce.banner] },
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
                bannerTitle: 1,
                page: 1,
                pageReference: 1,
                linkType: 1,
                link: 1,
                description: 1,
                blocks: 1,
                bannerImages: 1,
                position: 1,
                status: 1,
                createdAt: 1,
                languageValues: { $ifNull: ['$languageValues', []] }
            }
        }
        this.sort = {
            $sort: { createdAt: 1 } // Sort by createdAt field in descending order
        }
    }


    async findAll(options: FilterOptionsProps = {}): Promise<BannerProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: 1 };
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
            this.project,
        ];

        return BannerModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await BannerModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of banners');
        }
    }

    async create(bannerData: any): Promise<BannerProps | null> {
        const createdBanner = await BannerModel.create(bannerData);

        if (createdBanner) {
            const pipeline = [
                { $match: { _id: createdBanner._id } },
                this.lookup,
                this.project
            ];

            const createdBannerWithValues = await BannerModel.aggregate(pipeline);

            return createdBannerWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(bannerId: string): Promise<BannerProps | null> {
        if (bannerId) {
            const objectId = new mongoose.Types.ObjectId(bannerId);
            const pipeline = [
                { $match: { _id: objectId } },
                this.lookup,
                this.project
            ];

            const bannerDataWithValues = await BannerModel.aggregate(pipeline);

            return bannerDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(bannerId: string, bannerData: any): Promise<BannerProps | null> {
        const updatedBannner = await BannerModel.findByIdAndUpdate(
            bannerId,
            bannerData,
            { new: true, useFindAndModify: false }
        );
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                this.lookup,
                this.project
            ];

            const updatedBannnerWithValues = await BannerModel.aggregate(pipeline);

            return updatedBannnerWithValues[0];
        } else {
            return null;
        }
    }
    async setBannerBlocksImages(req: any, newBannerImages: any[], oldBannerImages?: any): Promise<any[]> {
        try {

            if (newBannerImages.length > 0) {
                let index: any;

                const bannerImagesUrl = await Promise.all(newBannerImages.map(async (newImage) => {
                    let bannerImageUrl = '';
                    if (newImage) {

                        index = this.getIndexFromFieldName(newImage.fieldname);
                        if (index !== -1 && oldBannerImages && index < oldBannerImages.length) {
                            // Update the corresponding element if index is found
                            bannerImageUrl = oldBannerImages[index].bannerImageUrl;
                            if ((!bannerImageUrl) || (bannerImageUrl !== undefined)) {
                                bannerImageUrl = await handleFileUpload(req, null, newImage, 'bannerImageUrl', 'banner');
                            }
                        } else {
                            // Otherwise, upload a new image
                            bannerImageUrl = await handleFileUpload(req, null, newImage, 'bannerImageUrl', 'banner');
                        }
                    } else {

                        bannerImageUrl = '';
                    }
                    return { bannerImageUrl, bannerImage: '' };
                }));

                let combinedImages: any[] = []
                if ((index !== -1) && (oldBannerImages)) {
                    oldBannerImages.splice(index, 1);
                }

                if (oldBannerImages) {
                    combinedImages = [...bannerImagesUrl, ...oldBannerImages];
                } else {
                    combinedImages = bannerImagesUrl
                }
                // console.log(index, 'combinedImages', combinedImages);

                // console.log('oldBannerImages', oldBannerImages);
                return combinedImages;
            } else {
                return oldBannerImages;
            }
        } catch (error) {
            console.error('Error in setBannerBlocksImages:', error);
            throw new Error('Failed to set banner block images');
        }
    }

    getIndexFromFieldName(fieldname: string): number {
        // Extract the index from fieldname using regular expression
        const match = fieldname?.match(/languageValues\[\d+\]\[languageValues\]\[(\d+)\]/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        return -1; // Return -1 if index not found
    }
    // getIndexFromFieldName(fieldname: string): number {
    //     // Extract the index from fieldname using regular expression
    //     const match = fieldname?.match(/bannerImages\[(\d+)\]/);
    //     if (match && match[1]) {
    //         return parseInt(match[1], 10);
    //     }
    //     return -1; // Return -1 if index not found
    // }

    async destroy(bannerId: string): Promise<BannerProps | null> {
        return BannerModel.findOneAndDelete({ _id: bannerId });
    }
}

export default new BannerService();
