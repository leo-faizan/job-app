const elasticsearch = require('../config/elasticsearch');

// State to track Elasticsearch availability
let isAvailable = false;

async function checkConnection() {
    try {
        await elasticsearch.ping();
        isAvailable = true;
        console.log('Elasticsearch connection established.');
        return true;
    } catch (error) {
        console.log('Elasticsearch not available. Search functionality will be disabled.');
        isAvailable = false;
        return false;
    }
}

async function createJobIndex() {
    if (!isAvailable) return;
    
    try {
        const exists = await elasticsearch.indices.exists({
            index: 'jobs'
        });

        if (!exists) {
            await elasticsearch.indices.create({
                index: 'jobs',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            title: { type: 'text', analyzer: 'standard' },
                            description: { type: 'text', analyzer: 'standard' },
                            location: { type: 'keyword' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error creating jobs index:', error.message);
    }
}

async function createApplicationIndex() {
    if (!isAvailable) return;
    
    try {
        const exists = await elasticsearch.indices.exists({
            index: 'applications'
        });

        if (!exists) {
            await elasticsearch.indices.create({
                index: 'applications',
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            job_id: { type: 'integer' },
                            applicant_name: { type: 'text' },
                            email: { type: 'keyword' },
                            resume_url: { type: 'keyword' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error creating applications index:', error.message);
    }
}

async function indexJob(job) {
    if (!isAvailable) return;
    
    try {
        await elasticsearch.index({
            index: 'jobs',
            id: job.id,
            body: {
                id: job.id,
                title: job.title,
                description: job.description,
                location: job.location,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt
            }
        });
    } catch (error) {
        console.error('Error indexing job:', error.message);
    }
}

async function indexApplication(application) {
    if (!isAvailable) return;
    
    try {
        await elasticsearch.index({
            index: 'applications',
            id: application.id,
            body: {
                id: application.id,
                job_id: application.job_id,
                applicant_name: application.applicant_name,
                email: application.email,
                resume_url: application.resume_url,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt
            }
        });
    } catch (error) {
        console.error('Error indexing application:', error.message);
    }
}

async function searchJobs(query = {}) {
    if (!isAvailable) {
        return [];
    }
    
    try {
        const { location, keyword } = query;
        let searchBody = {
            query: {
                bool: {
                    must: []
                }
            }
        };

        if (keyword) {
            searchBody.query.bool.must.push({
                multi_match: {
                    query: keyword,
                    fields: ['title', 'description']
                }
            });
        }

        if (location) {
            searchBody.query.bool.must.push({
                term: {
                    location: location
                }
            });
        }

        if (searchBody.query.bool.must.length === 0) {
            searchBody.query = { match_all: {} };
        }

        const response = await elasticsearch.search({
            index: 'jobs',
            body: searchBody
        });

        return response.hits.hits.map(hit => hit._source);
    } catch (error) {
        console.error('Error searching jobs:', error.message);
        return [];
    }
}

async function searchJobsWithFacets(keyword = '', filters = {}) {
    if (!isAvailable) {
        return {
            jobs: [],
            facets: {}
        };
    }
    
    try {
        const { location, dateRange } = filters;
        
        let searchBody = {
            query: {
                bool: {
                    must: [],
                    filter: []
                }
            },
            aggs: {
                locations: {
                    terms: {
                        field: "location",
                        size: 20
                    }
                },
                creation_dates: {
                    date_histogram: {
                        field: "createdAt",
                        calendar_interval: "month",
                        format: "yyyy-MM"
                    }
                }
            },
            size: 20,
            from: filters.from || 0,
            sort: [
                { "_score": { "order": "desc" } },
                { "createdAt": { "order": "desc" } }
            ]
        };

        // Add keyword search
        if (keyword && keyword.trim()) {
            searchBody.query.bool.must.push({
                multi_match: {
                    query: keyword.trim(),
                    fields: ['title^2', 'description'],
                    type: "best_fields",
                    fuzziness: "AUTO"
                }
            });
        } else {
            searchBody.query.bool.must.push({
                match_all: {}
            });
        }

        // Add location filter
        if (location && location.trim()) {
            searchBody.query.bool.filter.push({
                term: {
                    location: location
                }
            });
        }

        // Add date range filter
        if (dateRange && (dateRange.from || dateRange.to)) {
            const dateFilter = {
                range: {
                    createdAt: {}
                }
            };
            
            if (dateRange.from) {
                dateFilter.range.createdAt.gte = dateRange.from;
            }
            if (dateRange.to) {
                dateFilter.range.createdAt.lte = dateRange.to;
            }
            
            searchBody.query.bool.filter.push(dateFilter);
        }

        const response = await elasticsearch.search({
            index: 'jobs',
            body: searchBody
        });

        // Check if response and hits exist
        if (!response || !response.hits || !response.hits.hits) {
            console.error('Invalid response structure:', response);
            return {
                jobs: [],
                facets: {},
                total: 0
            };
        }

        const jobs = response.hits.hits.map(hit => ({
            ...hit._source,
            score: hit._score
        }));

        const facets = {
            locations: response.aggregations?.locations?.buckets?.map(bucket => ({
                value: bucket.key,
                count: bucket.doc_count
            })) || [],
            creationDates: response.aggregations?.creation_dates?.buckets?.map(bucket => ({
                value: bucket.key_as_string,
                count: bucket.doc_count
            })) || [],
            total: response.hits.total?.value || 0
        };

        return {
            jobs,
            facets,
            total: response.hits.total?.value || 0
        };
    } catch (error) {
        console.error('Error searching jobs with facets:', error.message);
        return {
            jobs: [],
            facets: {},
            total: 0
        };
    }
}

async function reindexAllJobs() {
    if (!isAvailable) {
        console.log('Elasticsearch not available, skipping reindexing');
        return;
    }

    try {
        const { Job } = require('../models');
        const jobs = await Job.findAll();
        
        console.log(`Reindexing ${jobs.length} jobs...`);
        
        for (const job of jobs) {
            await indexJob(job);
        }
        
        // Refresh the index to make documents immediately searchable
        await elasticsearch.indices.refresh({ index: 'jobs' });
        
        console.log(`Successfully reindexed ${jobs.length} jobs`);
    } catch (error) {
        console.error('Error reindexing jobs:', error.message);
    }
}

async function initializeIndices() {
    await checkConnection();
    if (isAvailable) {
        await createJobIndex();
        await createApplicationIndex();
        await reindexAllJobs(); // Reindex existing jobs
        console.log('Elasticsearch indices initialized.');
    }
}

function getIsAvailable() {
    return isAvailable;
}

module.exports = {
    checkConnection,
    createJobIndex,
    createApplicationIndex,
    indexJob,
    indexApplication,
    searchJobs,
    searchJobsWithFacets,
    reindexAllJobs,
    initializeIndices,
    getIsAvailable
};