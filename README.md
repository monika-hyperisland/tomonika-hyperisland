# Vefskólinn LMS

[![CI](https://github.com/ellertsmari/io.vefskoliv2/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ellertsmari/io.vefskoliv2/actions/workflows/ci.yml)

**A home for learning, building, and sharing work.**

The learning management system for Vefskólinn's web development programme. Students follow learning guides, build projects, review each other's work, and track their progress. Teachers manage the course, give feedback, and see where students need support.

[Features](#features) · [Run locally](#run-locally) · [Development](#development) · [Project structure](#project-structure) · [Documentation](#documentation)

## Features

| Area | What it supports |
| --- | --- |
| **Learning guides** | Code and design material organised by module, with learning outcomes, resources, and an editor for teachers. |
| **Projects and peer review** | Project submissions, feedback between students, teacher grading of reviews, and clear progress states. |
| **Interactive exercises** | Quizzes, short answers, and JavaScript/TypeScript coding tasks, with feedback, saved attempts, and teacher review of held answers. |
| **Community activity logs** | Activity forms with dates, hours, evidence images, teacher approval, and progress across configurable reporting periods. |
| **Group projects** | Team workspaces, project milestones, rubric assessment, peer evaluation, and publication to the project showcase. |
| **Course planning** | A semester calendar, teacher availability, and student meeting bookings. |
| **People and progress** | Student and teacher dashboards, account approvals, profiles, and teacher reports. |
| **Lecture resources** | Zoom recording listings and a link to shared Google Drive materials. |
| **Canvas integration** | LTI 1.3 launch, content selection, and grade passback endpoints when configured. |

### How learning works

A **guide** is a learning unit: its instructions, outcomes, resources, and completion requirements live together. Guides support three completion paths:

| Path | Student work | Assessment |
| --- | --- | --- |
| **Project** | Submit a **return** containing project links and a reflection; review other students' work. | Peers review the project. Teachers grade the reviews students write. |
| **Exercise** | Complete quiz, short-answer, or code tasks on the guide page. | The exercise engine checks answers; held short answers can be reviewed by a teacher. |
| **Activity log** | Record participation, time spent, and supporting evidence. | Teachers approve activities; approved hours count toward the reporting-period targets. |

The Module 2 Community & Networking activity log has a separate activation and reporting-year setup step. See the [activity log guide](docs/activity-log-guide.md) for the hour targets, carry-forward rules, and migration instructions.

## Run locally

### 1. Install dependencies

Use **Node.js 24**, matching [CI](.github/workflows/ci.yml), and a MongoDB database for local development. The commands below follow CI's npm workflow and use `package-lock.json`.

```bash
git clone https://github.com/ellertsmari/io.vefskoliv2.git
cd io.vefskoliv2
npm ci
```

### 2. Configure the environment

Create `.env.local` in the project root:

```dotenv
MONGODB_CONNECTION=mongodb://127.0.0.1:27017/vefskolinn_dev
AUTH_SECRET=replace-with-a-generated-secret
NEXTAUTH_URL=http://localhost:3000
# Optional: required for project and team image uploads
BLOB_READ_WRITE_TOKEN=your-vercel-blob-read-write-token
```

Generate a value for `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Use your development database connection string if MongoDB runs elsewhere. Local environment files are ignored by Git.

### 3. Start the app

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

New registrations need teacher approval before they can sign in. For an empty development database, register your account, then have the database administrator set that account's `role` to `teacher` and `status` to `active` in the `users` collection. That teacher can approve later registrations on the **People** page and create learning guides in the guide editor.

### Optional integrations

Configure these only when working on the corresponding feature:

| Integration | Configuration |
| --- | --- |
| **Zoom recordings** | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, and `ZOOM_CLIENT_SECRET` for the configured account's server-to-server OAuth app. |
| **Canvas / LTI** | Start with [.env.lti.example](.env.lti.example) and the [LTI setup guide](documentation/LTI_SETUP.md). Existing LTI routes also read `NEXTAUTH_SECRET`; keep it aligned with `AUTH_SECRET`. |
| **Vercel Blob** | Connect a Blob store and set its `BLOB_READ_WRITE_TOKEN` in the local environment and in each Vercel deployment environment that needs image uploads. See the [upload route](app/api/blob/upload/route.ts). |
| **Google Drive** | Currently a shared-folder link in [GoogleDriveButton](app/LMS/resources/components/googleDriveButton/googleDriveButton.tsx). Automatic recording uploads are not implemented. |

Activity-log evidence images use a separate, authenticated storage path; they are not public showcase uploads.

## Development

The app uses **Next.js App Router, React, TypeScript, MongoDB/Mongoose, Auth.js, and styled-components**. Tests use Jest, Testing Library, and an isolated MongoDB test server. Code exercises execute through QuickJS WebAssembly with TypeScript checking on the server.

### Everyday commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm test -- --runInBand` | Run the test suite sequentially. |
| `npm run build` | Create the production build. |
| `npm run typecheck` | Check TypeScript, including generated route types. |
| `npm run verify:trace` | Check that the build includes the runtime files needed by the exercise engine. |
| `npm run verify` | Run the build, type check, tests, and build trace check in order. |
| `npm start` | Serve an existing production build. |

On a fresh checkout, build before running the standalone type check: Next.js generates the route and asset declarations it needs. CI follows that order.

If a development server is already running, put the production build in its own directory so it does not overwrite the development output:

```bash
NEXT_DIST_DIR=.next-verify npm run build
NEXT_DIST_DIR=.next-verify npm run verify:trace
```

The repository contains both npm and Yarn lockfiles, and `package.json` declares Yarn. CI currently installs with npm. Keep dependency changes consistent across the committed lockfiles.

### Working with course data

Guide content and student records live in MongoDB. A fresh database does not automatically contain the school's curriculum. The guide editor can create guides; scripts in [`scripts/`](scripts/) handle specific migrations and setup tasks.

Review each script's purpose and target database before running it. The [Module 2 activation script](scripts/enable-module2-activity-log.mjs) previews changes by default and requires `--apply` to update the guide. Reporting-year dates are then configured by a teacher in the activity log.

## Project structure

```text
app/
├── LMS/                 Dashboards, calendar, groups, reports, and resources
├── guides/              Guide pages, exercises, submissions, and activity logs
├── showcase/            Public group-project showcase
├── api/                 Route handlers for guides, uploads, evidence, and LTI
├── components/          Feature components and navigation
├── UIcomponents/        Shared interface components
├── models/              MongoDB schemas and model types
├── serverActions/       Data access and server-side operations
├── lib/                 Authentication, Canvas/LTI, and supporting services
├── utils/               Grading, progress, validation, and shared helpers
├── globalStyles/        Theme tokens and shared styles
└── providers/           React context providers
types/                   Shared application types
__tests__/               Component, API, server-action, and utility tests
scripts/                 Data migrations and verification tools
docs/                    Feature behaviour and implementation notes
documentation/           Integration setup and supporting documentation
auth.ts / auth.config.ts Authentication and session configuration
proxy.ts                 Request-level authentication
next.config.mjs          Build, headers, uploads, and runtime file tracing
vercel.json              Deployment configuration
```

## Documentation

| Topic | Read more |
| --- | --- |
| Project submissions and reviews | [Peer review workflow](docs/PEER_REVIEW_WORKFLOW.md) |
| Writing exercise questions | [Exercise authoring](docs/exercise-authoring.md) |
| Exercise engine decisions | [Exercise engine notes](docs/exercise-engine-tasks.md) |
| Community participation forms | [Activity logs and Module 2 setup](docs/activity-log-guide.md) |
| Group assessment | [Peer evaluation](docs/peer-evaluation.md) |
| Who can see feedback and grades | [Feedback visibility](docs/feedback-visibility.md) |
| Canvas connection | [LTI setup](documentation/LTI_SETUP.md) · [Canvas integration](documentation/CANVAS_INTEGRATION_GUIDE.md) |

Some longer design notes describe earlier implementation stages. Use the current code and tests to confirm behaviour when a historical note differs.
