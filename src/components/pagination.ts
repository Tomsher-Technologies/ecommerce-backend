export interface FilterOptionsProps {
    page?: number;
    limit?: number;
    query?: any;
    sort?: any; 
    hostName?: string | undefined | null;
}

export const pagination = (query: any, options: FilterOptionsProps): { query: any; skip: number; limit: number; sort?: any; hostName?: string | undefined | null } => {
    let { page = 1, limit = 10, sort, hostName } = options;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;
    return { query, skip, limit, sort, hostName };
};
