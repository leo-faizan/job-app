Live Coding Task: Build a Mini Job Application API
📘 Context:
You're building a simple job application system where users can apply to jobs. Implement the backend logic to manage jobs and applications.
🛠️ Requirements:
Entities:
Job (id, title, description, location, created_at)
Application (id, job_id, applicant_name, email, resume_url, created_at)
Task:
Model Setup:
Define the two entities using an ORM (TypeORM or Sequelize)
Set up the relation: one Job can have many Applications
Set up Elastic search and sync job and applications to it.
API Endpoints:
POST /jobs: Create a job
GET /jobs/:id: Get a job and all its applications
POST /jobs/:id/apply: Apply to a job (validate email + resume_url)
GET /applications: Get all applications (optionally filter by job_id)
Bonus (if time):
Add pagination to /applications
Add search filter to /jobs?location=remote&keyword=node