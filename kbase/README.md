# ODS Digital Signage - Knowledge Base

**Institutional memory and technical documentation for the ODS Digital Signage platform**

Last Updated: February 11, 2026

---

## 📚 What is this?

This knowledge base (`kbase`) serves as the **permanent institutional memory** for the ODS Digital Signage project. It provides complete context for future iterations (AI agents, developers, team members) to understand the system without starting from scratch.

---

## 📁 Directory Structure

```
kbase/
├── README.md                    # This file
├── kbase_index.md              # Master navigation (START HERE!)
├── PROJECT_OVERVIEW.md         # Complete system architecture
│
├── artifacts/
│   ├── current/                # Latest documentation
│   │   ├── auth/              # Authentication & multi-tenancy
│   │   ├── database/          # Database schema & migrations
│   │   ├── api/               # API route documentation
│   │   ├── frontend/          # Frontend components
│   │   ├── deployment/        # Deployment guides
│   │   └── task.md            # Master task list
│   │
│   └── archive/               # Historical artifacts
│       └── [phase walkthroughs, plans, etc.]
│
└── docs/
    ├── reference/             # Technical reference
    ├── guides/                # How-to guides
    └── milestones/            # Project milestones
```

---

## 🚀 Quick Start

### For New Team Members / AI Iterations

1. **Start here:** Read [`kbase_index.md`](./kbase_index.md) for master navigation
2. **System overview:** Read [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) for complete architecture
3. **Current work:** Check [`artifacts/current/task.md`](./artifacts/current/task.md) for status
4. **Latest docs:** Browse [`artifacts/current/`](./artifacts/current/) for system-specific documentation

### For Specific Tasks

**Setting up authentication:**
- Quick start: [`artifacts/current/auth/supabase_quick_start.md`](./artifacts/current/auth/supabase_quick_start.md)
- Comprehensive: [`../server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md`](../server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md)

**Understanding tenant isolation:**
- Read: [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) → Security Model
- Walkthrough: [`artifacts/current/auth/phase5_tenant_filtering_walkthrough.md`](./artifacts/current/auth/phase5_tenant_filtering_walkthrough.md)

---

## 🎯 Key Documentation

### Essential Reading

1. **[kbase_index.md](./kbase_index.md)** - Master navigation
2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Complete system architecture
3. **[artifacts/current/task.md](./artifacts/current/task.md)** - Master task list

### Current Phase (Phase 5: Auth & Multi-Tenancy)

- **[phase5_tenant_filtering_walkthrough.md](./artifacts/current/auth/phase5_tenant_filtering_walkthrough.md)** - Implementation walkthrough
- **[phase5_auth_plan.md](./artifacts/current/auth/phase5_auth_plan.md)** - Implementation plan
- **[supabase_quick_start.md](./artifacts/current/auth/supabase_quick_start.md)** - 5-minute setup

---

## 📝 Contributing

When adding new documentation:
1. Create file in `artifacts/current/[system]/`
2. Update [`kbase_index.md`](./kbase_index.md) with new entry
3. Add cross-references to related docs
4. Archive old versions to `artifacts/archive/`

---

**ODS Digital Signage Platform** - Multi-Tenant SaaS Digital Signage Management System 🎨✨  
**Pattern:** Inspired by pds-backbone kbase structure
