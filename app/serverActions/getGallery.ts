"use server";

import mongoose, { PipelineStage, Types } from "mongoose";
import { connectToDatabase } from "./mongoose-connector";
import { Return } from "models/return";
import { Vote } from "models/review";
import { ModuleType } from "models/guide";

type ModuleSummary = Pick<ModuleType, "title" | "number">;

type GalleryAggregateResult = {
  returnId: Types.ObjectId;
  title: string;
  description: string;
  studentName: string;
  module: ModuleSummary;
  guideTitle: string;
  recommendationCount: number;
  pictureUrl?: string;
  projectUrl?: string;
  liveVersion?: string;
  createdAt: Date;
};

export type GalleryItem = {
  returnId: string;
  title: string;
  description: string;
  studentName: string;
  module: ModuleSummary;
  guideTitle: string;
  recommendationCount: number;
  returnImage: string | null;
  returnGif: string | null;
  returnUrl: string | null;
  createdAt: string;
};

const buildPipeline = (limit?: number): PipelineStage[] => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "return",
        as: "reviews",
      },
    },
    {
      $addFields: {
        recommendationCount: {
          $size: {
            $filter: {
              input: "$reviews",
              as: "review",
              cond: { $eq: ["$$review.vote", Vote.RECOMMEND_TO_GALLERY] },
            },
          },
        },
      },
    },
    {
      $match: {
        recommendationCount: { $gt: 0 },
      },
    },
    {
      $lookup: {
        from: "guides",
        localField: "guide",
        foreignField: "_id",
        as: "guide",
      },
    },
    { $unwind: "$guide" },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        _id: 0,
        returnId: "$_id",
        title: "$projectName",
        description: "$comment",
        studentName: "$owner.name",
        module: {
          title: "$guide.module.title",
          number: "$guide.module.number",
        },
        guideTitle: "$guide.title",
        recommendationCount: 1,
        pictureUrl: "$pictureUrl",
        projectUrl: "$projectUrl",
        liveVersion: "$liveVersion",
        createdAt: "$createdAt",
      },
    },
    {
      $sort: {
        recommendationCount: -1,
        createdAt: -1,
        returnId: 1,
      },
    },
  ];

  if (limit) {
    pipeline.push({ $limit: limit });
  }

  return pipeline;
};

const parseMedia = (url?: string): { image: string | null; gif: string | null } => {
  if (!url) {
    return { image: null, gif: null };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { image: null, gif: null };
  }

  return trimmed.toLowerCase().endsWith(".gif")
    ? { image: null, gif: trimmed }
    : { image: trimmed, gif: null };
};

const mapAggregateToItem = (doc: GalleryAggregateResult): GalleryItem => {
  const { image, gif } = parseMedia(doc.pictureUrl);

  return {
    returnId: doc.returnId.toString(),
    title: doc.title,
    description: doc.description,
    studentName: doc.studentName,
    module: doc.module,
    guideTitle: doc.guideTitle,
    recommendationCount: doc.recommendationCount,
    returnImage: image,
    returnGif: gif,
    returnUrl: doc.liveVersion ?? doc.projectUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB not connected. Skipping gallery fetch.");
      return [];
    }

    const pipeline = buildPipeline(4);
    const results = await Return.aggregate<GalleryAggregateResult>(pipeline);

    return results.map(mapAggregateToItem);
  } catch (error) {
    if (error instanceof Error && error.name === "MongoNotConnectedError") {
      console.warn("MongoDB connection unavailable during gallery fetch. Returning empty list.");
      return [];
    }
    console.error("Failed to fetch gallery items:", error);
    return [];
  }
}

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB not connected. Skipping gallery fetch.");
      return [];
    }

    const pipeline = buildPipeline();
    const results = await Return.aggregate<GalleryAggregateResult>(pipeline);

    return results.map(mapAggregateToItem);
  } catch (error) {
    if (error instanceof Error && error.name === "MongoNotConnectedError") {
      console.warn("MongoDB connection unavailable during gallery fetch. Returning empty list.");
      return [];
    }
    console.error("Failed to fetch all gallery items:", error);
    return [];
  }
}
