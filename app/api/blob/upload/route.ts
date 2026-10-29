import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "../../../../auth";
import {
  IMAGE_ALLOWED_CONTENT_TYPES,
  IMAGE_MAX_UPLOAD_BYTES,
} from "../../../utils/imageUpload";

/**
 * Issues a short-lived token so the browser can upload an image straight to
 * Vercel Blob.
 *
 * The bytes never pass through this function — that is the point. Previously
 * images travelled inline as base64 data URLs through a server action (hence
 * the inflated `bodySizeLimit` in next.config.mjs) and were then stored inside
 * the Mongo document, which meant they could never be cached by a browser or
 * CDN and were re-sent on every render of every page that listed them.
 *
 * Only signed-in users get a token, and the token itself constrains what can
 * be written: image content types only, and a hard byte ceiling. A stolen
 * token cannot be used to fill the store with arbitrary files.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...IMAGE_ALLOWED_CONTENT_TYPES],
        maximumSizeInBytes: IMAGE_MAX_UPLOAD_BYTES,
        // Uploads are public: the showcase is served to anonymous visitors, so
        // the images on it have to be fetchable without a session. What is
        // consent-gated is whether a URL is ever *published* — see
        // setShowcaseConsent — not whether the object store will serve it.
        addRandomSuffix: true,
        // Content is immutable per URL (a replacement gets a new random
        // suffix), so it can be cached hard.
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        tokenPayload: JSON.stringify({ userId: session.user.id }),
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    // The message from @vercel/blob can name internals (token scopes, store
    // ids); the browser only needs to know the upload did not go through.
    console.error("Blob upload error:", error);
    if (
      error instanceof Error &&
      error.message.includes("No read-write token found")
    ) {
      return NextResponse.json(
        {
          error:
            "Image uploads are not configured. Connect a Vercel Blob store and set BLOB_READ_WRITE_TOKEN for this environment.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
