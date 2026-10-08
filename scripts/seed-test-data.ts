import { config } from "dotenv";
import { faker } from "@faker-js/faker";

import { User } from "../app/models/user.ts";
import { Guide } from "../app/models/guide.ts";
import { Return } from "../app/models/return.ts";
import { Review, Vote } from "../app/models/review.ts";

// Load environment variables from .env.local
config({ path: ".env.local" });

const MODULES = [
  { number: 1, title: "1 - Foundations" },
  { number: 2, title: "2 - Interfaces & Interaction" },
  { number: 3, title: "3 - Data & Logic" },
  { number: 4, title: "4 - Prototyping" },
  { number: 5, title: "5 - Final Project" },
];

const DISCIPLINES = ["code", "design"] as const;

const GALLERY_TARGET_COUNT = 6;
const RETURN_TARGET_COUNT = 20;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeProjectUrl(title: string) {
  return `https://${toSlug(title)}.example.com`;
}

function makeLiveUrl(title: string) {
  return `https://${toSlug(title)}-demo.example.com`;
}

function makeGuideTemplate(index: number, moduleNumber: number) {
  const discipline = DISCIPLINES[index % DISCIPLINES.length];
  const special = index % 3 === 0;
  const title = faker.company.catchPhrase();

  return {
    title: `${moduleNumber} - ${title}`,
    description: faker.lorem.paragraph({ min: 2, max: 4 }),
    discipline,
    isSpecialty: special,
    category: special ? `${discipline}Specialty` : discipline,

    references: [
      {
        type: "article",
        name: `${discipline === "code" ? "Code" : "Design"} reference`,
        link: `https://example.com/reference/${toSlug(title)}`,
      },
      {
        type: "resource",
        name: "Helpful walkthrough",
        link: `https://example.com/walkthrough/${toSlug(title)}`,
      },
    ],

    knowledge: [
      { knowledge: faker.lorem.sentence() },
      { knowledge: faker.lorem.sentence() },
    ],

    skills: [
      { skill: faker.lorem.words(3) },
      { skill: faker.lorem.words(3) },
    ],

    resources: [
      {
        link: `https://example.com/resources/${toSlug(title)}`,
        description: faker.lorem.sentence(),
      },
      {
        link: `https://example.com/examples/${toSlug(title)}`,
        description: faker.lorem.sentence(),
      },
    ],

    themeIdea: {
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    },

    topicsList: faker.lorem.words(8),

    module: {
      title:
        MODULES[moduleNumber - 1]?.title ?? `Module ${moduleNumber}`,
      number: moduleNumber,
    },

    classes: [
      {
        title: faker.company.name(),
        link: `https://example.com/class/${toSlug(
          faker.company.name()
        )}`,
      },
    ],

    order: index,
    gradingMode: "peerReview",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function upsertUser(
  seed: { email: string } & Record<string, unknown>
) {
  const existing = await User.findOne({
    email: seed.email,
  });

  if (existing) {
    Object.assign(existing, seed);
    await existing.save();
    return existing;
  }

  return User.create(seed);
}

async function upsertGuide(seed: Record<string, unknown>) {
  const guideKey = {
    title: seed.title,
    "module.number": (seed as {
      module: { number: number };
    }).module.number,
  };

  const existing = await Guide.findOne(guideKey);

  if (existing) {
    Object.assign(existing, seed);
    await existing.save();
    return existing;
  }

  return Guide.create(seed);
}

async function upsertReturn(seed: Record<string, unknown>) {
  const existing = await Return.findOne({
    owner: seed.owner,
    guide: seed.guide,
    projectName: seed.projectName,
  });

  if (existing) {
    Object.assign(existing, seed);
    await existing.save();
    return existing;
  }

  return Return.create(seed);
}

async function seedData({
  reset = false,
  dryRun = false,
}: {
  reset?: boolean;
  dryRun?: boolean;
} = {}) {
  /*
   * DRY RUN
   *
   * This does not connect to MongoDB.
   * It only shows what the seed intends to create.
   */
  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          teachers: 3,
          students: 18,
          guides: 6,
          returns: RETURN_TARGET_COUNT,
          reviews: RETURN_TARGET_COUNT * 3,
          galleryTargets: GALLERY_TARGET_COUNT,
          summary:
            "This would create a realistic course setup with teachers, students, project returns, peer reviews, and Hall of Fame recommendations.",
        },
        null,
        2
      )
    );

    return;
  }

  /*
   * Make sure MongoDB connection exists.
   */
  if (!process.env.MONGODB_CONNECTION) {
    throw new Error(
      "Missing MONGODB_CONNECTION in .env.local"
    );
  }

  /*
   * Import the DB connector only AFTER .env.local
   * has been loaded.
   */
  const { connectToDatabase } = await import(
    "../app/serverActions/mongoose-connector.ts"
  );

  await connectToDatabase();

  console.log("Connected to MongoDB.");

  /*
   * WARNING:
   *
   * --reset removes existing users, guides,
   * returns, and reviews from the selected database.
   */
  if (reset) {
    console.log("Resetting seed collections...");

    await Promise.all([
      User.deleteMany({}),
      Guide.deleteMany({}),
      Return.deleteMany({}),
      Review.deleteMany({}),
    ]);
  }

  /*
   * --------------------------------------------------
   * TEACHERS
   * --------------------------------------------------
   */

  const teacherSeeds = Array.from(
    { length: 3 },
    (_, index) => ({
      name: `Teacher ${index + 1}`,
      email: `teacher${index + 1}@school.test`,
      password: "Password123!",
      role: "teacher" as const,
      status: "active" as const,
      background: faker.person.bio(),
      careerGoals: faker.lorem.sentence(),
      interests: faker.lorem.sentence(),
      favoriteArtists: faker.person.firstName(),
      avatarUrl: faker.image.avatarGitHub(),
    })
  );

  const teachers = await Promise.all(
    teacherSeeds.map((teacher) =>
      upsertUser(teacher)
    )
  );

  /*
   * --------------------------------------------------
   * STUDENTS
   * --------------------------------------------------
   */

  const studentSeeds = Array.from(
    { length: 18 },
    (_, index) => ({
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: `student${index + 1}@school.test`,
      password: "Password123!",
      role: "user" as const,
      status: "active" as const,
      background: faker.person.bio(),
      careerGoals: faker.lorem.sentence(),
      interests: faker.lorem.sentence(),
      favoriteArtists: faker.person.firstName(),
      avatarUrl: faker.image.avatarGitHub(),
    })
  );

  const students = await Promise.all(
    studentSeeds.map((student) =>
      upsertUser(student)
    )
  );

  /*
   * --------------------------------------------------
   * GUIDES
   * --------------------------------------------------
   */

  const guides = await Promise.all(
    Array.from({ length: 6 }, (_, index) => {
      const moduleNumber = ((
        index % MODULES.length
      ) + 1) as 1 | 2 | 3 | 4 | 5;

      return upsertGuide({
        ...makeGuideTemplate(
          index,
          moduleNumber
        ),
      });
    })
  );

  /*
   * --------------------------------------------------
   * RETURNS / PROJECTS
   * --------------------------------------------------
   */

  const returns: any[] = [];

  for (
    let guideIndex = 0;
    guideIndex < guides.length;
    guideIndex += 1
  ) {
    const guide = guides[guideIndex];

    const assignedStudents = students.slice(
      guideIndex,
      guideIndex + 4
    );

    if (assignedStudents.length === 0) {
      assignedStudents.push(
        ...students.slice(0, 3)
      );
    }

    for (
      let i = 0;
      i < assignedStudents.length;
      i += 1
    ) {
      /*
       * Stop once we have 20 project returns.
       */
      if (
        returns.length >=
        RETURN_TARGET_COUNT
      ) {
        break;
      }

      const student =
        assignedStudents[i];

      const title = `${guide.title} - ${student.name}`;

      const returnDoc =
        await upsertReturn({
          projectUrl:
            makeProjectUrl(title),

          liveVersion:
            makeLiveUrl(title),

          pictureUrl:
            faker.image.urlPicsumPhotos({
              width: 1200,
              height: 900,
            }),

          projectName: title,

          comment:
            faker.lorem.paragraph({
              min: 2,
              max: 4,
            }),

          owner: student._id,
          guide: guide._id,

          createdAt: new Date(
            Date.now() -
              i * 86400000
          ),
        });

      returns.push(returnDoc);
    }

    if (
      returns.length >=
      RETURN_TARGET_COUNT
    ) {
      break;
    }
  }

  /*
   * --------------------------------------------------
   * GALLERY TARGETS
   * --------------------------------------------------
   *
   * Pick a small number of returns that should
   * definitely appear in the Hall of Fame.
   */

  const galleryTargets = returns
    .filter(
      (_, index) =>
        index % 3 === 0
    )
    .slice(
      0,
      Math.min(
        GALLERY_TARGET_COUNT,
        returns.length
      )
    );

  const galleryTargetIds = new Set(
    galleryTargets.map((project) =>
      project._id.toString()
    )
  );

  /*
   * --------------------------------------------------
   * PEER REVIEWS
   * --------------------------------------------------
   *
   * Each project receives 3 peer reviews.
   *
   * Gallery target projects receive at least one:
   *
   * Vote.RECOMMEND_TO_GALLERY
   */

  const totalReviews: any[] = [];

  for (const project of returns) {
    const reviewerPool =
      students.filter(
        (student) =>
          student._id.toString() !==
          project.owner.toString()
      );

    const chosenReviewers =
      reviewerPool.slice(0, 3);

    for (
      let i = 0;
      i <
      chosenReviewers.length;
      i += 1
    ) {
      const reviewer =
        chosenReviewers[i];

      /*
       * If the review already exists,
       * update it instead of creating
       * a duplicate.
       */
      const existingReview =
        await Review.findOne({
          owner: reviewer._id,
          return: project._id,
        });

      let vote: Vote;

      /*
       * Guarantee one Hall of Fame
       * recommendation for selected
       * projects.
       */
      if (
        i === 0 &&
        galleryTargetIds.has(
          project._id.toString()
        )
      ) {
        vote =
          Vote.RECOMMEND_TO_GALLERY;
      } else {
        vote =
          Math.random() > 0.4
            ? Vote.PASS
            : Vote.NO_PASS;
      }

      if (existingReview) {
        existingReview.guide =
          project.guide;

        existingReview.vote =
          vote;

        existingReview.comment =
          faker.lorem.sentences({
            min: 1,
            max: 3,
          });

        await existingReview.save();

        totalReviews.push(
          existingReview
        );

        continue;
      }

      const review =
        await Review.create({
          guide: project.guide,
          return: project._id,
          owner: reviewer._id,
          vote,

          comment:
            faker.lorem.sentences({
              min: 1,
              max: 3,
            }),

          createdAt: new Date(
            Date.now() -
              i * 43200000
          ),
        });

      totalReviews.push(review);
    }
  }

  /*
   * --------------------------------------------------
   * VERIFY HALL OF FAME DATA
   * --------------------------------------------------
   */

  const recommendedReviews =
    await Review.find({
      return: {
        $in: returns.map(
          (project) => project._id
        ),
      },
      vote:
        Vote.RECOMMEND_TO_GALLERY,
    })
      .select("return vote")
      .lean();

  const recommendedReturnIds =
    new Set(
      recommendedReviews.map(
        (review) =>
          review.return.toString()
      )
    );

  /*
   * --------------------------------------------------
   * RESULT
   * --------------------------------------------------
   */

  console.log(
    JSON.stringify(
      {
        inserted: {
          teachers:
            teachers.length,

          students:
            students.length,

          guides: guides.length,

          returns:
            returns.length,

          reviews:
            totalReviews.length,

          galleryProjects:
            recommendedReturnIds.size,
        },

        sampleTeacher:
          teachers[0]?.email,

        sampleStudent:
          students[0]?.email,

        sampleGuide:
          guides[0]?.title,

        sampleProject:
          returns[0]?.projectName,
      },
      null,
      2
    )
  );
}

/*
 * --------------------------------------------------
 * COMMAND-LINE ARGUMENTS
 * --------------------------------------------------
 */

const args = new Set(
  process.argv.slice(2)
);

const reset =
  args.has("--reset");

const dryRun =
  args.has("--dry-run");

/*
 * Start seed.
 */
seedData({
  reset,
  dryRun,
}).catch((error) => {
  console.error(
    "Seed failed:",
    error
  );

  process.exit(1);
});