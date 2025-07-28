const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200', // Default Elasticsearch URL
    // Add authentication if needed
    auth: {
        username: 'elastic',
        password: 'oW1qEYX2'
    }
});

module.exports = client;