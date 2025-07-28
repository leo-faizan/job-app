# Job Application API

A RESTful API for managing job postings and applications built with Node.js, Express, MySQL, Sequelize, and Elasticsearch using a **function-based architecture**.

## Features

- **Job Management**: Create and retrieve job postings
- **Application Management**: Apply to jobs and retrieve applications
- **Search Functionality**: Search jobs by keywords and location using Elasticsearch
- **Pagination**: Paginated results for applications
- **Data Validation**: Comprehensive input validation
- **Function-based Architecture**: Clean separation of concerns using modular functions

## Architecture

This project follows a **function-based approach** instead of class-based controllers:
- **Controllers**: Export individual functions for each route handler
- **Services**: Modular functions for business logic (Elasticsearch operations)
- **Clean Imports**: Routes import specific functions using destructuring

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- Elasticsearch (v7 or higher)

## Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd talently-assesment
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up MySQL database:**
   - Install MySQL Server if not already installed
   - Create a database named `test`
   - Update database credentials in `src/config/database.js`:
     ```javascript
     const sequelize = new Sequelize("test", "your_username", "your_password", {
         dialect: "mysql",
         host: "localhost",
         logging: false,
     });
     ```

4. **Set up Elasticsearch:**
   - Install and start Elasticsearch on `http://localhost:9200`
   - If using authentication, update credentials in `src/config/elasticsearch.js`:
     ```javascript
     const client = new Client({
         node: 'http://localhost:9200',
         auth: {
             username: 'your_username',
             password: 'your_password'
         }
     });
     ```
   - For development without authentication, remove the `auth` object

5. **Start the server:**
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will start on port 3000 and automatically:
- Create database tables
- Initialize Elasticsearch indices
- Display available endpoints

## API Endpoints

### Jobs

#### Create a Job
- **POST** `/jobs`
- **Body**:
```json
{
  "title": "Software Engineer",
  "description": "We are looking for a skilled software engineer...",
  "location": "New York"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "title": "Software Engineer",
  "description": "We are looking for a skilled software engineer...",
  "location": "New York",
  "createdAt": "2025-07-28T10:00:00.000Z",
  "updatedAt": "2025-07-28T10:00:00.000Z"
}
```

#### Get All Jobs
- **GET** `/jobs`
- **Query Parameters** (optional):
  - `location`: Filter by location
  - `keyword`: Search in title and description
- **Example**: `/jobs?location=New York&keyword=engineer`
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Software Engineer",
    "description": "We are looking for a skilled software engineer...",
    "location": "New York",
    "createdAt": "2025-07-28T10:00:00.000Z",
    "updatedAt": "2025-07-28T10:00:00.000Z"
  }
]
```

#### Search Jobs with Facets
- **GET** `/jobs/search`
- **Query Parameters** (optional):
  - `keyword`: Search in title and description
  - `location`: Filter by location
  - `dateFrom`: Filter jobs created after this date
  - `dateTo`: Filter jobs created before this date
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
- **Example**: `/jobs/search?keyword=developer&location=Remote&page=1&limit=10`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "facets": {
      "locations": [
        {"value": "New York", "count": 5},
        {"value": "Remote", "count": 3}
      ],
      "creationDates": [
        {"value": "2025-07", "count": 8}
      ],
      "total": 8
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

#### Get Job by ID
- **GET** `/jobs/:id`
- **Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Software Engineer",
  "description": "We are looking for a skilled software engineer...",
  "location": "New York",
  "createdAt": "2025-07-28T10:00:00.000Z",
  "updatedAt": "2025-07-28T10:00:00.000Z",
  "applications": [
    {
      "id": 1,
      "job_id": 1,
      "applicant_name": "John Doe",
      "email": "john@example.com",
      "resume_url": "https://example.com/resume.pdf",
      "createdAt": "2025-07-28T10:30:00.000Z",
      "updatedAt": "2025-07-28T10:30:00.000Z"
    }
  ]
}
```

### Applications

#### Apply to a Job
- **POST** `/jobs/:id/apply`
- **Body**:
```json
{
  "applicant_name": "John Doe",
  "email": "john@example.com",
  "resume_url": "https://example.com/resume.pdf"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "job_id": 1,
  "applicant_name": "John Doe",
  "email": "john@example.com",
  "resume_url": "https://example.com/resume.pdf",
  "createdAt": "2025-07-28T10:30:00.000Z",
  "updatedAt": "2025-07-28T10:30:00.000Z"
}
```

#### Get All Applications
- **GET** `/applications`
- **Query Parameters** (optional):
  - `job_id`: Filter by job ID
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Example**: `/applications?job_id=1&page=2&limit=5`
- **Response**: `200 OK`
```json
{
  "applications": [
    {
      "id": 1,
      "job_id": 1,
      "applicant_name": "John Doe",
      "email": "john@example.com",
      "resume_url": "https://example.com/resume.pdf",
      "createdAt": "2025-07-28T10:30:00.000Z",
      "updatedAt": "2025-07-28T10:30:00.000Z",
      "job": {
        "id": 1,
        "title": "Software Engineer",
        "location": "New York"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Health Check
- **GET** `/health`
- **Response**: `200 OK`
```json
{
  "status": "OK",
  "message": "Job Application API is running"
}
```

## Project Structure

```
├── package.json
├── server.js                 # Main application entry point
├── src/
│   ├── config/
│   │   ├── database.js       # Database configuration
│   │   └── elasticsearch.js  # Elasticsearch configuration
│   ├── controllers/
│   │   ├── jobController.js       # Job-related functions (createJob, getAllJobs, etc.)
│   │   └── applicationController.js # Application-related functions (applyToJob, getAllApplications)
│   ├── models/
│   │   ├── Job.js            # Job model definition
│   │   ├── Application.js    # Application model definition
│   │   └── index.js          # Model relationships
│   ├── routes/
│   │   ├── jobs.js           # Job routes
│   │   └── applications.js   # Application routes
│   └── services/
│       └── elasticsearchService.js # Elasticsearch functions (indexJob, searchJobs, etc.)
```

## Function-based Architecture

### Controllers
Controllers export individual functions instead of class methods:

```javascript
// Before (Class-based)
class JobController {
    async createJob(req, res) { ... }
    async getAllJobs(req, res) { ... }
}
module.exports = new JobController();

// After (Function-based)
async function createJob(req, res) { ... }
async function getAllJobs(req, res) { ... }
module.exports = { createJob, getAllJobs };
```

### Routes
Routes import specific functions using destructuring:

```javascript
// Function-based approach
const { createJob, getAllJobs } = require('../controllers/jobController');
router.post('/', createJob);
router.get('/', getAllJobs);
```

### Services
Services provide modular functions for business logic:

```javascript
// elasticsearchService.js exports individual functions
module.exports = {
    checkConnection,
    indexJob,
    searchJobs,
    initializeIndices
};
```

## Validation Rules

### Job Creation
- `title`: Required, non-empty string
- `description`: Required, non-empty string
- `location`: Required, non-empty string

### Job Application
- `applicant_name`: Required, non-empty string
- `email`: Required, valid email format
- `resume_url`: Required, must start with http:// or https://

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "error": "Invalid email format"
}
```

## Search Functionality

The API uses Elasticsearch for advanced search capabilities:

- **Keyword Search**: Searches in job title and description with fuzzy matching
- **Location Filter**: Exact match on job location
- **Date Range Filter**: Filter jobs by creation date
- **Faceted Search**: Get aggregated data for locations and creation dates
- **Combined Search**: Use multiple filters together

When search parameters are provided, the API automatically uses Elasticsearch for faster and more relevant results. If Elasticsearch is unavailable, the system gracefully falls back to database queries.

## Development

### Running in Development Mode

The project includes nodemon for auto-restart during development:

```bash
npm run dev
```

### Database Schema

The application automatically creates the following tables:

**jobs**
- `id` (Primary Key, Auto Increment)
- `title` (VARCHAR)
- `description` (TEXT)
- `location` (VARCHAR)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

**applications**
- `id` (Primary Key, Auto Increment)
- `job_id` (Foreign Key to jobs.id)
- `applicant_name` (VARCHAR)
- `email` (VARCHAR)
- `resume_url` (VARCHAR)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

### Elasticsearch Indices

The application automatically creates and manages:

- **jobs** index: For job search functionality
- **applications** index: For application data

## Troubleshooting

### Database Connection Issues
- Ensure MySQL server is running
- Verify database credentials in `src/config/database.js`
- Check if the `test` database exists

### Elasticsearch Issues
- Verify Elasticsearch is running on `http://localhost:9200`
- Check authentication credentials if using secured Elasticsearch
- The application will work without Elasticsearch but search functionality will be limited

### Common Errors
- **Port 3000 already in use**: Kill the process using the port or change the port in `server.js`
- **Module not found**: Run `npm install` to install dependencies
- **Database connection refused**: Check if MySQL is running and credentials are correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.