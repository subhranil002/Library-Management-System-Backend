import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { 
    getAnalyticsOverview, 
    getTopEntities, 
    getTimeSeriesData 
} from "../services/analytics.service.js";
import { subDays, startOfDay, endOfDay } from "date-fns";

const parseDates = (req) => {
    const { from, to } = req.query;
    // Default to last 30 days if not provided
    const endDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());
    const startDate = from ? startOfDay(new Date(from)) : startOfDay(subDays(endDate, 30));
    return { startDate, endDate };
};

// GET /admin/analytics/overview
export const getOverview = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate } = parseDates(req);
        const { branchId } = req.query;

        const overview = await getAnalyticsOverview(startDate, endDate, branchId);

        // Also get time-series for issues to plot on the main dashboard chart
        const timeSeries = await getTimeSeriesData("TOTAL_ISSUES", startDate, endDate, branchId);

        res.status(200).json(new ApiResponse("Analytics overview fetched successfully", {
            period: { startDate, endDate },
            totals: overview,
            chartData: timeSeries
        }));
    } catch (error) {
        next(new ApiError(`analytics.controller :: getOverview :: ${error.message}`, error.statusCode || 500));
    }
});

// GET /admin/analytics/books/top-issued
export const getTopIssuedBooks = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate } = parseDates(req);
        const { branchId, limit = 10 } = req.query;

        const topBooks = await getTopEntities("TOP_ISSUED_BOOKS", startDate, endDate, limit, branchId);

        res.status(200).json(new ApiResponse("Top issued books fetched", topBooks));
    } catch (error) {
        next(new ApiError(`analytics.controller :: getTopIssuedBooks :: ${error.message}`, error.statusCode || 500));
    }
});

// GET /admin/analytics/authors/trending
export const getTrendingAuthors = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate } = parseDates(req);
        const { limit = 10 } = req.query; // Usually global, not branch specific

        const trending = await getTopEntities("TRENDING_AUTHORS", startDate, endDate, limit, null);

        res.status(200).json(new ApiResponse("Trending authors fetched", trending));
    } catch (error) {
        next(new ApiError(`analytics.controller :: getTrendingAuthors :: ${error.message}`, error.statusCode || 500));
    }
});

// GET /admin/analytics/genres/trending
export const getTrendingGenres = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate } = parseDates(req);
        const { limit = 10 } = req.query;

        const trending = await getTopEntities("TRENDING_GENRES", startDate, endDate, limit, null);

        res.status(200).json(new ApiResponse("Trending genres fetched", trending));
    } catch (error) {
        next(new ApiError(`analytics.controller :: getTrendingGenres :: ${error.message}`, error.statusCode || 500));
    }
});
