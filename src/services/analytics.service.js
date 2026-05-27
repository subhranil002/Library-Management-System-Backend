import { AnalyticsDaily } from "../models/index.js";
import { getCache, setCache } from "../utils/cache.js";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * Helper to get overview stats for a specific date range and optional branch
 */
export const getAnalyticsOverview = async (startDate, endDate, branchId = null) => {
    const query = {
        date: { $gte: startDate, $lte: endDate },
        metricType: { $in: ["TOTAL_ISSUES", "TOTAL_RETURNS", "TOTAL_RESERVATIONS", "NEW_USERS", "FINES_COLLECTED"] }
    };
    if (branchId) query.branchId = branchId;

    const data = await AnalyticsDaily.aggregate([
        { $match: query },
        {
            $group: {
                _id: "$metricType",
                totalCount: { $sum: "$count" },
                totalValue: { $sum: "$value" }
            }
        }
    ]);

    const result = {
        issues: 0,
        returns: 0,
        reservations: 0,
        newUsers: 0,
        finesCollected: 0
    };

    data.forEach(item => {
        if (item._id === "TOTAL_ISSUES") result.issues = item.totalCount;
        if (item._id === "TOTAL_RETURNS") result.returns = item.totalCount;
        if (item._id === "TOTAL_RESERVATIONS") result.reservations = item.totalCount;
        if (item._id === "NEW_USERS") result.newUsers = item.totalCount;
        if (item._id === "FINES_COLLECTED") result.finesCollected = item.totalValue;
    });

    return result;
};

/**
 * Get top entities (books, authors, genres) for a period
 */
export const getTopEntities = async (metricType, startDate, endDate, limit = 10, branchId = null) => {
    const query = {
        date: { $gte: startDate, $lte: endDate },
        metricType
    };
    
    // Only apply branchId filter if not null and the metric type supports it (e.g. issues/reservations)
    // Genres and authors from search events might be global.
    if (branchId) {
        query.branchId = branchId;
    }

    const cacheKey = `analytics:${metricType}:${startDate.getTime()}:${endDate.getTime()}:${branchId || 'GLOBAL'}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const data = await AnalyticsDaily.aggregate([
        { $match: query },
        {
            $group: {
                _id: "$entityId",
                totalCount: { $sum: "$count" },
                metadata: { $first: "$metadata" } // Keep contextual data like titles
            }
        },
        { $sort: { totalCount: -1 } },
        { $limit: Number(limit) }
    ]);

    const formatted = data.map(item => ({
        id: item._id,
        count: item.totalCount,
        ...item.metadata
    }));

    await setCache(cacheKey, formatted, 3600); // cache for 1 hour

    return formatted;
};

/**
 * Returns a time-series chart data format for a specific metric over time
 */
export const getTimeSeriesData = async (metricType, startDate, endDate, branchId = null) => {
    const query = {
        date: { $gte: startDate, $lte: endDate },
        metricType,
        entityType: "SYSTEM" // Filter out granular book logs to get the daily total
    };
    if (branchId) query.branchId = branchId;

    const data = await AnalyticsDaily.find(query)
        .select("date count value -_id")
        .sort({ date: 1 })
        .lean();

    return data.map(d => ({
        date: d.date.toISOString().split("T")[0],
        count: d.count,
        value: d.value
    }));
};
