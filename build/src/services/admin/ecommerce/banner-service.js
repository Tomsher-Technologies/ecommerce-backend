"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const banner_model_1 = __importDefault(require("../../../model/admin/ecommerce/banner-model"));
const helpers_1 = require("../../../utils/helpers");
const banner_config_1 = require("../../../utils/config/banner-config");
class BannerService {
    constructor() {
        this.sort = {
            $sort: { createdAt: 1 } // Sort by createdAt field in descending order
        };
    }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: 1 };
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
            banner_config_1.bannerLookup,
            banner_config_1.bannerProject,
        ];
        return banner_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await banner_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of banners');
        }
    }
    async create(bannerData) {
        const createdBanner = await banner_model_1.default.create(bannerData);
        if (createdBanner) {
            const pipeline = [
                { $match: { _id: createdBanner._id } },
                banner_config_1.bannerLookup,
                banner_config_1.bannerProject
            ];
            const createdBannerWithValues = await banner_model_1.default.aggregate(pipeline);
            return createdBannerWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(bannerId) {
        if (bannerId) {
            const objectId = new mongoose_1.default.Types.ObjectId(bannerId);
            const pipeline = [
                { $match: { _id: objectId } },
                banner_config_1.bannerLookup,
                banner_config_1.bannerProject
            ];
            const bannerDataWithValues = await banner_model_1.default.aggregate(pipeline);
            return bannerDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(bannerId, bannerData) {
        const updatedBannner = await banner_model_1.default.findByIdAndUpdate(bannerId, bannerData, { new: true, useFindAndModify: false });
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                banner_config_1.bannerLookup,
                banner_config_1.bannerProject
            ];
            const updatedBannnerWithValues = await banner_model_1.default.aggregate(pipeline);
            return updatedBannnerWithValues[0];
        }
        else {
            return null;
        }
    }
    async setBannerBlocksImages(req, newBannerImages, oldBannerImages) {
        try {
            if (newBannerImages.length > 0) {
                let index;
                const bannerImagesUrl = await Promise.all(newBannerImages.map(async (newImage) => {
                    let bannerImageUrl = '';
                    if (newImage) {
                        index = this.getIndexFromFieldName(newImage.fieldname);
                        if (index !== -1 && oldBannerImages && index < oldBannerImages.length) {
                            // Update the corresponding element if index is found
                            bannerImageUrl = oldBannerImages[index].bannerImageUrl;
                            if ((!bannerImageUrl) || (bannerImageUrl !== undefined)) {
                                bannerImageUrl = await (0, helpers_1.handleFileUpload)(req, null, newImage, 'bannerImageUrl', 'banner');
                            }
                        }
                        else {
                            // Otherwise, upload a new image
                            bannerImageUrl = await (0, helpers_1.handleFileUpload)(req, null, newImage, 'bannerImageUrl', 'banner');
                        }
                    }
                    else {
                        bannerImageUrl = '';
                    }
                    return { bannerImageUrl, bannerImage: '' };
                }));
                let combinedImages = [];
                if ((index !== -1) && (oldBannerImages)) {
                    oldBannerImages.splice(index, 1);
                }
                if (oldBannerImages) {
                    combinedImages = [...bannerImagesUrl, ...oldBannerImages];
                }
                else {
                    combinedImages = bannerImagesUrl;
                }
                // console.log(index, 'combinedImages', combinedImages);
                // console.log('oldBannerImages', oldBannerImages);
                return combinedImages;
            }
            else {
                return oldBannerImages;
            }
        }
        catch (error) {
            console.error('Error in setBannerBlocksImages:', error);
            throw new Error('Failed to set banner block images');
        }
    }
    getIndexFromFieldName(fieldname) {
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
    async destroy(bannerId) {
        return banner_model_1.default.findOneAndDelete({ _id: bannerId });
    }
}
exports.default = new BannerService();
