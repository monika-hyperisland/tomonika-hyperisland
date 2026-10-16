"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { auth } from "../../auth";
import { Return } from "../models/return";
import { connectToDatabase } from "./mongoose-connector";
import { objectIdSchema } from "./groups/helpers";
import { deleteReplacedImages } from "./blobCleanup";
import { optionalStoredImageSchema } from "../utils/imageUpload";
import { isActingAsTeacher } from "../utils/userUtils";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

type UpdateReturnState = ActionResult<void> | undefined;

export type UpdateReturnData = {
  returnId: string;
  projectName: string;
  comment: string;
  pictureUrl?: string;
  galleryVisible: boolean;
};

const UpdateReturnSchema = z.object({
  returnId: objectIdSchema,
  projectName: z
    .string()
    .trim()
    .min(2, { message: "Please enter a valid project title" })
    .max(200, { message: "Keep the project title under 200 characters" }),
  comment: z
    .string()
    .trim()
    .min(2, { message: "Please enter a valid description" })
    .max(5000, { message: "Keep the description under 5000 characters" }),
  pictureUrl: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    optionalStoredImageSchema.optional()
  ),
  galleryVisible: z.boolean(),
});

/**
 * Edit the latest return a student made for its guide, in place, without
 * creating a new return entry.
 */
export async function updateReturnSubmission(
  state: UpdateReturnState,
  data: UpdateReturnData
): Promise<ActionResult<void>> {
  const validated = UpdateReturnSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  const session = await auth();
  if (!session?.user) {
    return failure("You must be logged in to edit a return");
  }
  if (isActingAsTeacher(session)) {
    return failure("Switch to a student view to edit your return");
  }

  const { returnId, projectName, comment, pictureUrl, galleryVisible } =
    validated.data;

  try {
    await connectToDatabase();

    const currentReturn = await Return.findById(returnId);
    if (!currentReturn) return failure(ErrorMessages.NOT_FOUND("Return"));

    if (currentReturn.owner.toString() !== session.user.id) {
      return failure(ErrorMessages.NOT_AUTHORIZED);
    }

    const latestForGuide = await Return.findOne(
      { owner: new ObjectId(session.user.id), guide: currentReturn.guide },
      { _id: 1 }
    ).sort({ createdAt: -1 });

    if (!latestForGuide || latestForGuide._id.toString() !== returnId) {
      return failure("Only your latest return for this guide can be edited");
    }

    const previousPicture = currentReturn.pictureUrl || "";
    const nextPicture = pictureUrl || "";

    if (
      currentReturn.projectName === projectName &&
      currentReturn.comment === comment &&
      previousPicture === nextPicture &&
      currentReturn.galleryVisible !== false === galleryVisible
    ) {
      return successNoData("Nothing to change");
    }

    currentReturn.projectName = projectName;
    currentReturn.comment = comment;
    currentReturn.pictureUrl = nextPicture;
    currentReturn.galleryVisible = galleryVisible;
    await currentReturn.save();
    await deleteReplacedImages([previousPicture], [nextPicture]);

    return successNoData("Return updated");
  } catch (error) {
    return handleActionError(
      "updateReturnSubmission",
      error,
      ErrorMessages.FAILED_TO_UPDATE("return")
    );
  }
}