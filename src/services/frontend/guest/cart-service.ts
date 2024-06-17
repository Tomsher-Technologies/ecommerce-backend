import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';

import BrandsModel, { BrandProps } from '../../../model/admin/ecommerce/brands-model';
import { capitalizeWords, slugify } from '../../../utils/helpers';
import { brandLookup } from '../../../utils/config/brand-config';
import GeneralService from '../../../services/admin/general-service';
import CartsModel from '../../../model/frontend/cart-order-model';


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

            brandLookup,
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

    async create(cartData: any): Promise<BrandProps | null> {
        const createdCart = await CartsModel.create(cartData);

        if (createdCart) {
            const pipeline = [
                { $match: { _id: createdCart._id } },
            ];

            const createdCartWithValues = await CartsModel.aggregate(pipeline);

            return createdCartWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(brandId: string): Promise<BrandProps | null> {
        if (brandId) {
            const objectId = new mongoose.Types.ObjectId(brandId);
            const pipeline = [
                { $match: { _id: objectId } },
                brandLookup,
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
                brandLookup,
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

        const resultBrand: any = await this.findBrand({ slug: slug });
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
}

export default new BrandsService();
