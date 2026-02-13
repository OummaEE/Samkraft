# Samkraft

**Digital platform for immigrants and local residents in Sweden to build community through verified volunteer projects**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)

## 🌟 Overview

Samkraft is a civic-tech platform designed to bridge the integration gap in Sweden by enabling immigrants (including asylum seekers and those without work permits) to contribute to society through verified volunteer projects while building credible portfolios for future employment.

### Key Features

✅ **No Personnummer Required** - Register with email or phone number  
✅ **Verified Certificates** - Earn official participation certificates  
✅ **Portfolio Building** - Build a professional portfolio of community work  
✅ **Mentor Network** - Connect with Swedish mentors and professionals  
✅ **Impact Tracking** - Measurable outcomes for individuals and municipalities  
✅ **Multilingual** - Support for Swedish, English, Arabic, Ukrainian, Russian  

## 🎯 Mission

*"Enable every person in Sweden to contribute their skills to society, regardless of legal status, and build verifiable proof of their capabilities and commitment."*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/samkraft.git
   cd samkraft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up local database:**
   ```bash
   npm run db:migrate:local
   npm run db:seed
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start development server:**
   ```bash
   # Using PM2 (recommended for sandbox)
   pm2 start ecosystem.config.cjs

   # Or using wrangler directly
   npm run dev:d1
   ```

6. **Access the application:**
   ```
   http://localhost:3000
   ```

### Available Scripts

```bash
npm run dev              # Start Vite dev server
npm run dev:sandbox      # Start with wrangler (sandbox environment)
npm run dev:d1           # Start with local D1 database
npm run build            # Build for production
npm run deploy           # Deploy to Cloudflare Pages
npm run deploy:prod      # Deploy to production project

# Database commands
npm run db:migrate:local # Apply migrations locally
npm run db:migrate:prod  # Apply migrations to production
npm run db:seed          # Seed local database with test data
npm run db:reset         # Reset local database
npm run db:console:local # Open local D1 console
npm run db:console:prod  # Open production D1 console

# Utility commands
npm run clean-port       # Kill process on port 3000
npm run test             # Test local server
npm run git:status       # Git status shortcut
```

## 📦 Project Structure

```
samkraft/
├── migrations/                 # Database migrations
│   └── 0001_initial_schema.sql
├── public/                     # Static assets
│   └── static/
│       ├── app.js             # Frontend JavaScript
│       └── styles.css         # Custom CSS
├── src/
│   └── index.tsx              # Main Hono application
├── ecosystem.config.cjs       # PM2 configuration
├── package.json               # Dependencies and scripts
├── seed.sql                   # Test data
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite build config
└── wrangler.jsonc             # Cloudflare configuration
```

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts with tier-based verification
- **projects** - Volunteer projects with lifecycle management
- **project_roles** - Role definitions within projects
- **project_participants** - Applications and memberships
- **skills** - Skill taxonomy (multilingual)
- **user_skills** - User skills with mentor validation
- **certificates** - Verified participation certificates
- **recommendations** - Recommendation letters
- **messages** - In-app messaging
- **municipalities** - Municipality partners
- **activity_log** - Impact tracking

## 🔐 User Roles

1. **Participant** - Register, join projects, earn certificates
2. **Project Creator** - Propose and manage projects
3. **Mentor/Validator** - Validate contributions, issue certificates
4. **Municipality Representative** - Sponsor projects, access analytics
5. **Platform Administrator** - System management

## 🌍 Deployment to Cloudflare Pages

### Prerequisites

1. **Create Cloudflare D1 Database:**
   ```bash
   npx wrangler d1 create samkraft-db
   ```
   
   Copy the `database_id` and update `wrangler.jsonc`:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "samkraft-db",
       "database_id": "YOUR_DATABASE_ID_HERE"
     }
   ]
   ```

2. **Apply migrations to production:**
   ```bash
   npm run db:migrate:prod
   ```

3. **Create Cloudflare Pages project:**
   ```bash
   npx wrangler pages project create samkraft --production-branch main
   ```

4. **Deploy:**
   ```bash
   npm run deploy:prod
   ```

### Continuous Deployment

Connect your GitHub repository to Cloudflare Pages for automatic deployments on push:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Pages > Create a project
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: Link D1 database

## 📊 Data Architecture

### Storage Services

- **Cloudflare D1** - Primary database (SQLite at edge)
- **Cloudflare KV** - Session caching (future)
- **Cloudflare R2** - File storage for certificates/photos (future)

### Data Models

- Progressive trust model (4 tiers: basic → verified → validated → personnummer)
- Project lifecycle: draft → review → approved → active → completed
- Certificate verification via cryptographic hashing
- Impact score algorithm tracking contribution quality

## 🔒 Security & Privacy

- **GDPR Compliant** - Minimal data collection, user consent required
- **No Personnummer Required** - Alternative identity verification
- **Encrypted** - TLS 1.3 in transit, encrypted at rest (Cloudflare)
- **JWT Authentication** - Secure API access
- **Rate Limiting** - DDoS protection via Cloudflare

## 🌐 API Endpoints

### Public Endpoints

```
GET  /api/health                          # Health check
GET  /api/projects                        # List projects (with filters)
GET  /api/projects/:id                    # Get project details
GET  /api/municipalities                  # List municipalities
GET  /api/skills                          # List skills
GET  /api/users/:username/portfolio       # Public portfolio
GET  /api/certificates/verify/:hash       # Verify certificate
```

### Authentication Required (Future)

```
POST /api/auth/register                   # Register new user
POST /api/auth/login                      # Login
POST /api/projects                        # Create project
POST /api/projects/:id/apply              # Apply to project
POST /api/certificates                    # Issue certificate
```

## 📈 Impact Metrics

### Platform Goals (3 Years)

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Active Users | 500 | 2,500 | 10,000 |
| Projects Completed | 50 | 300 | 1,200 |
| Certificates Issued | 200 | 1,500 | 6,000 |
| Municipality Partners | 2 | 8 | 25 |
| Hours Contributed | 5,000 | 30,000 | 120,000 |

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hono](https://hono.dev/) - Ultrafast web framework
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)
- Inspired by Nordic civic-tech initiatives
- Designed for integration and social cohesion

## 📞 Contact

- **Website:** [samkraft.se](https://samkraft.se) (coming soon)
- **Email:** [contact@samkraft.se](mailto:contact@samkraft.se)
- **GitHub:** [github.com/samkraft/samkraft](https://github.com/samkraft/samkraft)

## 🗺️ Roadmap

### Phase 1 (MVP - Months 1-3) ✅
- [x] User registration (email/phone)
- [x] Project marketplace
- [x] Basic certificate generation
- [x] Public portfolios
- [x] D1 database integration

### Phase 2 (Months 4-6)
- [ ] Authentication system (JWT)
- [ ] Project application workflow
- [ ] Mentor validation system
- [ ] Recommendation letters
- [ ] Municipality dashboard

### Phase 3 (Months 7-12)
- [ ] Mobile app (PWA)
- [ ] Advanced analytics
- [ ] Employer partnerships
- [ ] Multiple municipality support
- [ ] Integration with Swedish systems

### Phase 4 (Year 2+)
- [ ] Expansion to other Nordic countries
- [ ] API for third-party integrations
- [ ] AI-powered project matching
- [ ] Blockchain certificate anchoring

---

**Made with ❤️ for integration and social cohesion in Sweden**
