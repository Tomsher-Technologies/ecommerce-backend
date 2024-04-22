import { FilterOptionsProps, pagination } from '@components/pagination';

import CouponModel, { CouponProps } from '@model/admin/marketing/coupon-model';


class CouponService {
    async findAll(options: FilterOptionsProps = {}): Promise<CouponProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = CouponModel.find(query)
        .skip(skip)
        .limit(limit)
        .lean();

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CouponModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of coupons');
        }
    }

    async create(couponData: any): Promise<CouponProps> {
        return CouponModel.create(couponData);
    }

    async findOne(couponId: string): Promise<CouponProps | null> {
        return CouponModel.findById(couponId);
    }

    async update(couponId: string, couponData: any): Promise<CouponProps | null> {
        return CouponModel.findByIdAndUpdate(couponId, couponData, { new: true, useFindAndModify: false });
    }

    async destroy(couponId: string): Promise<CouponProps | null> {
        return CouponModel.findOneAndDelete({ _id: couponId });
    }
}

export default new CouponService();
