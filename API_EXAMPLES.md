# Samkraft API Examples

## API Base URL

**Local development:**
```
http://localhost:3000
```

**Production (after deployment):**
```
https://samkraft.pages.dev
https://your-custom-domain.se
```

---

## Authentication

**Status:** Not yet implemented (MVP phase)

**Coming soon:** JWT-based authentication

```bash
# Future endpoint
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

---

## Public Endpoints (No auth required)

### 1. Health Check

Check if the API is running.

```bash
curl https://samkraft.pages.dev/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-15T10:30:00.000Z",
  "service": "Samkraft API"
}
```

---

### 2. Get Projects

List all active projects with optional filters.

**Basic request:**
```bash
curl https://samkraft.pages.dev/api/projects
```

**With filters:**
```bash
# Filter by category
curl "https://samkraft.pages.dev/api/projects?category=environmental"

# Filter by municipality
curl "https://samkraft.pages.dev/api/projects?municipality=Stockholms%20kommun"

# Multiple filters
curl "https://samkraft.pages.dev/api/projects?category=social&municipality=Stockholms%20kommun&status=active"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj_001",
      "title": "Community Garden in Järva",
      "description_short": "Build a community garden together",
      "description_long": "We will create a 200m² community garden...",
      "category_primary": "environmental",
      "category_secondary": "social",
      "location_type": "physical",
      "location_municipality": "Stockholms kommun",
      "start_date": "2025-06-01",
      "end_date": "2025-09-30",
      "weekly_commitment": "4-6 hours/week",
      "max_participants": 15,
      "current_participants": 7,
      "status": "active",
      "created_at": "2025-05-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Single Project

Get detailed information about a specific project, including available roles.

```bash
curl https://samkraft.pages.dev/api/projects/proj_001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj_001",
    "title": "Community Garden in Järva",
    "description_long": "We will create a 200m² community garden...",
    "category_primary": "environmental",
    "location_municipality": "Stockholms kommun",
    "location_address": "Approximate location shown after application",
    "start_date": "2025-06-01",
    "end_date": "2025-09-30",
    "max_participants": 15,
    "current_participants": 7,
    "status": "active",
    "roles": [
      {
        "id": "role_001",
        "project_id": "proj_001",
        "title": "Garden Planner",
        "skills_required": "[\"gardening\", \"project_planning\"]",
        "skills_desired": "[\"swedish_language\"]",
        "positions_available": 2,
        "positions_filled": 1,
        "responsibilities": "Design layout, coordinate planting schedule"
      },
      {
        "id": "role_002",
        "project_id": "proj_001",
        "title": "Community Coordinator",
        "skills_required": "[\"communication\", \"event_planning\"]",
        "positions_available": 1,
        "positions_filled": 0
      }
    ]
  }
}
```

---

### 4. Get Municipalities

List all active municipalities on the platform.

```bash
curl https://samkraft.pages.dev/api/municipalities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "muni_001",
      "name": "Stockholms kommun",
      "budget_allocated": 500000.00,
      "budget_spent": 0,
      "active": 1,
      "joined_at": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "muni_002",
      "name": "Göteborgs kommun",
      "budget_allocated": 300000.00,
      "budget_spent": 0,
      "active": 1,
      "joined_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 5. Get Skills

List all available skills, optionally filtered by category.

**All skills:**
```bash
curl https://samkraft.pages.dev/api/skills
```

**Filter by category:**
```bash
curl "https://samkraft.pages.dev/api/skills?category=Languages"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "skill_001",
      "name": "Gardening",
      "category": "Environmental",
      "translated_names": "{\"sv\": \"Trädgårdsarbete\", \"en\": \"Gardening\"}"
    },
    {
      "id": "skill_006",
      "name": "Swedish Language",
      "category": "Languages",
      "translated_names": "{\"sv\": \"Svenska språket\", \"en\": \"Swedish Language\"}"
    }
  ]
}
```

---

### 6. Get User Portfolio (Public)

View a user's public portfolio with completed projects, certificates, and skills.

**Note:** Only works if user's profile is set to public.

```bash
curl https://samkraft.pages.dev/api/users/new_participant/portfolio
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_003",
      "username": "new_participant",
      "first_name": "Ahmed",
      "profile_photo_url": null,
      "bio": "Looking forward to contributing to the community",
      "location_municipality": "Stockholms kommun",
      "impact_score": 0,
      "tier": "verified",
      "created_at": "2025-05-01T10:00:00.000Z",
      "languages": "[\"ar\", \"en\"]"
    },
    "projects": [
      {
        "id": "proj_001",
        "title": "Community Garden in Järva",
        "hours_logged": 64,
        "rating_by_creator": 5,
        "completed_at": "2025-09-30T18:00:00.000Z"
      }
    ],
    "certificates": [
      {
        "id": "cert_001",
        "project_title": "Community Garden in Järva",
        "skills_validated": "[\"gardening\", \"teamwork\"]",
        "hours_contributed": 64,
        "issued_at": "2025-10-01T12:00:00.000Z"
      }
    ],
    "skills": [
      {
        "name": "Gardening",
        "category": "Environmental",
        "proficiency": "intermediate",
        "validated_at": "2025-10-01T12:00:00.000Z"
      }
    ],
    "stats": {
      "total_projects": 1,
      "total_certificates": 1,
      "total_skills": 1,
      "impact_score": 0
    }
  }
}
```

**Error response (private profile):**
```json
{
  "success": false,
  "error": "User not found or profile is private"
}
```

---

### 7. Verify Certificate

Verify the authenticity of a certificate using its hash.

```bash
curl https://samkraft.pages.dev/api/certificates/verify/abc123hash456
```

**Success response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "id": "cert_001",
    "first_name": "Ahmed",
    "username": "new_participant",
    "project_title": "Community Garden in Järva",
    "skills_validated": "[\"gardening\", \"teamwork\"]",
    "hours_contributed": 64,
    "outcome_description": "Successfully helped establish 200m² community garden",
    "issued_at": "2025-10-01T12:00:00.000Z",
    "mentor_first_name": "Anna",
    "mentor_username": "mentor_anna"
  }
}
```

**Invalid/revoked certificate:**
```json
{
  "success": false,
  "valid": false,
  "error": "Certificate not found or has been revoked"
}
```

---

## JavaScript Examples

### Fetch projects and display

```javascript
async function loadProjects() {
  try {
    const response = await fetch('https://samkraft.pages.dev/api/projects?status=active')
    const data = await response.json()
    
    if (data.success) {
      console.log(`Found ${data.count} projects`)
      data.data.forEach(project => {
        console.log(`- ${project.title} (${project.location_municipality})`)
      })
    }
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

loadProjects()
```

### Using Axios

```javascript
import axios from 'axios'

// Get projects with filters
const getProjects = async (category, municipality) => {
  const params = {
    status: 'active',
    ...(category && { category }),
    ...(municipality && { municipality })
  }
  
  const response = await axios.get('https://samkraft.pages.dev/api/projects', { params })
  return response.data
}

// Usage
const environmentalProjects = await getProjects('environmental', null)
const stockholmProjects = await getProjects(null, 'Stockholms kommun')
```

### Verify certificate on page load

```javascript
// Get certificate hash from URL
const urlParams = new URLSearchParams(window.location.search)
const certHash = urlParams.get('hash')

if (certHash) {
  fetch(`https://samkraft.pages.dev/api/certificates/verify/${certHash}`)
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        document.getElementById('status').innerHTML = 
          `✓ Valid certificate issued to ${data.data.first_name}`
      } else {
        document.getElementById('status').innerHTML = 
          '✗ Invalid or revoked certificate'
      }
    })
}
```

---

## Python Examples

### Using requests library

```python
import requests

# Get all active projects
response = requests.get('https://samkraft.pages.dev/api/projects')
data = response.json()

if data['success']:
    for project in data['data']:
        print(f"{project['title']} - {project['location_municipality']}")

# Filter by category
params = {
    'category': 'environmental',
    'municipality': 'Stockholms kommun'
}
response = requests.get('https://samkraft.pages.dev/api/projects', params=params)
filtered_projects = response.json()
```

### Verify certificate

```python
import requests

def verify_certificate(cert_hash):
    url = f'https://samkraft.pages.dev/api/certificates/verify/{cert_hash}'
    response = requests.get(url)
    data = response.json()
    
    if data.get('valid'):
        return {
            'valid': True,
            'recipient': data['data']['first_name'],
            'project': data['data']['project_title'],
            'hours': data['data']['hours_contributed']
        }
    else:
        return {'valid': False}

# Usage
result = verify_certificate('abc123hash456')
if result['valid']:
    print(f"Certificate valid for {result['recipient']}")
else:
    print("Certificate is invalid or revoked")
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**Common HTTP status codes:**
- `200` - Success
- `404` - Resource not found
- `500` - Server error

---

## Rate Limiting

**Current:** No rate limiting (MVP)

**Future:** 
- 100 requests per minute per IP
- 1000 requests per hour for authenticated users

---

## CORS

CORS is enabled for `/api/*` endpoints, allowing frontend applications to make requests from any origin.

---

## Testing the API

### Using curl

```bash
# Test if API is up
curl https://samkraft.pages.dev/api/health

# Get projects with pretty JSON output
curl -s https://samkraft.pages.dev/api/projects | jq '.'

# Save response to file
curl https://samkraft.pages.dev/api/projects > projects.json
```

### Using HTTPie

```bash
# Install: pip install httpie

# GET request
http https://samkraft.pages.dev/api/projects

# With query params
http https://samkraft.pages.dev/api/projects category==environmental
```

---

## Future Endpoints (Coming Soon)

**Authentication:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Projects:**
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/apply` - Apply to project
- `PUT /api/projects/:id/applicants/:userId/accept` - Accept applicant

**Certificates:**
- `POST /api/certificates` - Issue certificate (mentor only)
- `GET /api/certificates/:id/pdf` - Download PDF

**User Management:**
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/skills` - Add skills

---

**Need help?** Open an issue on GitHub or contact us at contact@samkraft.se
