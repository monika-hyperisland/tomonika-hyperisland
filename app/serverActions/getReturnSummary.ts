"use server";
import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { Return, type ReturnDocument } from "../models/return";
import { Review, type ReviewDocument } from "../models/review";
import { connectToDatabase } from "./mongoose-connector";
import { calculateReturnStatus } from "../utils/guideUtils";
import { handleActionError } from "../utils/errors";
import { REQUIRED_REVIEWS_COUNT } from "../constants/peerReview";
import { isoDate } from "../utils/serialization";
import { ReturnStatus } from "types/guideTypes";

/** Where the signed-in student's latest return of a guide stands. */
export type ReturnSummary = {
  id: string;
  projectName: string;
  comment: string;
  projectUrl: string;
  liveVersion: string;
  pictureUrl: string | null;
  galleryVisible: boolean;
  /** ISO date of the latest return. */
  returnedAt: string;
  status: ReturnStatus;
  /** Reviews received on the latest return, and how many it needs. */
  reviewsReceived: number;
  reviewsNeeded: number;
  /** How many times this guide has been returned in total. */
  returnCount: number;
};

/**
 * The latest return the signed-in user made for a guide, or null when
 * they have not returned it. Reviews are given on the latest return, so
 * that is the one whose status matters.
 */
export async function getReturnSummary(
  guideId: string
): Promise<ReturnSummary | null> {
  const session = await auth();
  if (!session?.user?.id || !ObjectId.isValid(guideId)) return null;

  try {
    await connectToDatabase();
    const returns = await Return.find({
      owner: new ObjectId(session.user.id),
      guide: new ObjectId(guideId),
    })
      .sort({ createdAt: -1 })
      .lean<ReturnDocument[]>();
    if (returns.length === 0) return null;

    const latest = returns[0];
    const reviews = await Review.find({ return: latest._id }).lean<ReviewDocument[]>();

    return {
      id: String(latest._id),
      projectName: latest.projectName,
      comment: latest.comment,
      projectUrl: latest.projectUrl,
      liveVersion: latest.liveVersion,
      pictureUrl: latest.pictureUrl ?? null,
      galleryVisible: latest.galleryVisible !== false,
      returnedAt: isoDate(latest.createdAt),
      status: calculateReturnStatus(returns, reviews),
      reviewsReceived: reviews.length,
      reviewsNeeded: REQUIRED_REVIEWS_COUNT,
      returnCount: returns.length,
    };
  } catch (error) {
    handleActionError("getReturnSummary", error);
    return null;
  }
}
