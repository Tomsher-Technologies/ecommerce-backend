export interface FilterOptionsProps {
    page?: number;
    limit?: number;
    query?: any;
    sort?: any; // Add sort property to FilterOptionsProps
}

export const pagination = (query: any, options: FilterOptionsProps): { query: any; skip: number; limit: number; sort?: any } => {
    const { page = 1, limit = 10, sort } = options; // Destructure sort from options
    const skip = (page - 1) * limit;
    return { query, skip, limit, sort }; // Include sort in the returned object
};