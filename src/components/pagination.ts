export interface FilterOptionsProps {
    page?: number;
    limit?: number;
    query?: any;
    sort?: any;
    block?: any;
    blockReference?: any;
    hostName?: string | undefined | null;
    getTotalCount?: boolean
}

export const pagination = (query: any, options: FilterOptionsProps): { query: any; skip: number; limit: number; sort?: any; blockReference?: string; block?: string; hostName?: string | undefined | null; getTotalCount?: boolean } => {
    let { page = 1, limit = 10, sort, hostName, blockReference, block, getTotalCount = false } = options;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;
    return { query, skip, limit, sort, hostName, blockReference, block, getTotalCount };
};

export const frontendPagination = (query: any, options: FilterOptionsProps): { query: any; skip: number; limit: number; sort?: any; blockReference?: string; block?: string; hostName?: string | undefined | null } => {
    let { page = 1, limit, sort, hostName, blockReference, block } = options;

    page = Number(page) || 1;
    limit = Number(limit);

    const skip = (page - 1) * limit;
    return { query, skip, limit, sort, hostName, blockReference, block };
};

