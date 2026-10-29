"use client";

import { useState } from "react";
import { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import { FaStar } from "react-icons/fa";
import { FiMonitor, FiPenTool } from "react-icons/fi";
import {
  GalleryItemContainer,
  GalleryItemImage,
  GalleryItemContent,
  GalleryItemTitle,
  GalleryItemStudent,
  GalleryItemDescription,
  GalleryTopicTags,
  GalleryTopicTag,
  GalleryTopicMore,
  GalleryTopicPopover,
  GalleryActions,
  GalleryActionLink,
  GalleryActionArrow,
  GalleryItemPlaceholder,
  GalleryMedia,
  GalleryItemHeader,
  RecommendationBadge,
  ModuleBadge,
  IframePreviewContainer,
  FigmaPreviewContainer,
} from "./styles";
import { getModuleNumber } from "./moduleNumber";

interface GalleryItemProps {
  item: GalleryItemType;
  compactCards?: boolean;
}

// Extract Figma file key from URL
const getFigmaFileKey = (url: string): string | null => {
  // Matches URLs like:
  // https://www.figma.com/file/ABC123/...
  // https://www.figma.com/design/ABC123/...
  // https://www.figma.com/proto/ABC123/...
  // https://figma.com/file/ABC123/...
  const match = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const getLinkLabel = (
  url: string,
  field: "projectUrl" | "liveVersion"
): string => {
  const hostname = getHostname(url);
  const isFigma = hostname === "figma.com" || hostname?.endsWith(".figma.com");
  const isGitHub = hostname === "github.com" || hostname?.endsWith(".github.com");
  if (field === "liveVersion") return "View Project";
  if (isGitHub) return "GITHUB";
  if (isFigma) return "FIGMA";
  return "Project source";
};

// Check if URL is a website (not GitHub, not Figma)
const isWebsiteUrl = (url: string): boolean => {
  if (!url) return false;
  // Exclude common non-previewable URLs
  const excludePatterns = [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'figma.com',
    'docs.google.com',
    'drive.google.com',
  ];
  return !excludePatterns.some(pattern => url.includes(pattern));
};

// Get Figma thumbnail URL using Figma's image API
const getFigmaThumbnailUrl = (fileKey: string): string => {
  // Figma provides a public thumbnail endpoint
  return `https://www.figma.com/file/${fileKey}/thumbnail`;
};

const PlatformIcon = ({ label }: { label: string }) => {
  if (label === "GITHUB") {
    return (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.93.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.24-5.11 5.52.4.35.76 1.03.76 2.08v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
      </svg>
    );
  }

  if (label === "FIGMA") {
    return (
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path fill="#F24E1E" d="M8 0h4v8H8a4 4 0 0 1 0-8Z" />
        <path fill="#FF7262" d="M12 0h4a4 4 0 0 1 0 8h-4V0Z" />
        <path fill="#A259FF" d="M8 8h4v8H8a4 4 0 0 1 0-8Z" />
        <path fill="#1ABCFE" d="M12 8h4a4 4 0 0 1 0 8h-4V8Z" />
        <path fill="#0ACF83" d="M8 16h4v4a4 4 0 1 1-4-4Z" />
      </svg>
    );
  }

  return null;
};

const GalleryLinks = ({ item, compactCards = false }: GalleryItemProps) => {
  if (!item.liveVersion && !item.projectUrl) return null;
  const hasBothLinks = Boolean(item.liveVersion && item.projectUrl);
  const liveVersionLabel = item.liveVersion
    ? getLinkLabel(item.liveVersion, "liveVersion")
    : null;
  const projectUrlLabel = item.projectUrl
    ? getLinkLabel(item.projectUrl, "projectUrl")
    : null;

  return (
    <GalleryActions $multiple={hasBothLinks} $compact={compactCards}>
      {item.liveVersion && (
        <GalleryActionLink
          href={item.liveVersion}
          target="_blank"
          rel="noopener noreferrer"
          $primary
          $multiple={hasBothLinks}
          $compact={compactCards}
        >
          <PlatformIcon label={liveVersionLabel ?? ""} />
          {liveVersionLabel}
          {liveVersionLabel === "View Project" && (
            <GalleryActionArrow aria-hidden="true">→</GalleryActionArrow>
          )}
        </GalleryActionLink>
      )}
      {item.projectUrl && (
        <GalleryActionLink
          href={item.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          $primary={false}
          $multiple={hasBothLinks}
          $compact={compactCards}
        >
          <PlatformIcon label={projectUrlLabel ?? ""} />
          {projectUrlLabel}
        </GalleryActionLink>
      )}
    </GalleryActions>
  );
};

const MAX_VISIBLE_TOPICS = 2;

const GalleryItem = ({ item, compactCards = false }: GalleryItemProps) => {
  const hasCustomImage = item.returnImage || item.returnGif;
  const moduleNumber = getModuleNumber(item.module);
  const figmaFileKey = item.returnUrl ? getFigmaFileKey(item.returnUrl) : null;
  const showFigmaPreview = !hasCustomImage && figmaFileKey;
  const showIframePreview = !hasCustomImage && !figmaFileKey && item.returnUrl && isWebsiteUrl(item.returnUrl);
  // A Figma thumbnail that fails to load falls back to the placeholder instead of an empty block.
  const [figmaFailed, setFigmaFailed] = useState(false);
  const hasPreview = hasCustomImage || (showFigmaPreview && !figmaFailed) || showIframePreview;
  const isDesignProject = item.projectUrl
    ? getLinkLabel(item.projectUrl, "projectUrl") === "FIGMA"
    : false;
  const visibleTopics = item.topics.slice(0, MAX_VISIBLE_TOPICS);
  const hiddenTopics = item.topics.slice(MAX_VISIBLE_TOPICS);

  return (
    <GalleryItemContainer>
      <GalleryMedia>
        <ModuleBadge $module={moduleNumber}>
          Module {moduleNumber ?? item.module.title}
        </ModuleBadge>
        {hasCustomImage && (
          <GalleryItemImage $compact={compactCards}>
            <img
              src={item.returnGif || item.returnImage || ""}
              alt={`${item.studentName}'s project`}
              loading="lazy"
            />
          </GalleryItemImage>
        )}

        {showFigmaPreview && !figmaFailed && (
          <FigmaPreviewContainer $compact={compactCards}>
            <img
              src={getFigmaThumbnailUrl(figmaFileKey)}
              alt={`${item.studentName}'s Figma design`}
              loading="lazy"
              onError={() => setFigmaFailed(true)}
            />
          </FigmaPreviewContainer>
        )}

        {showIframePreview && (
          <IframePreviewContainer $compact={compactCards}>
            <iframe
              src={item.returnUrl!}
              title={`${item.studentName}'s project preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </IframePreviewContainer>
        )}

        {!hasPreview && (
          <GalleryItemPlaceholder
            $module={moduleNumber}
            $compact={compactCards}
            aria-hidden="true"
          >
            {isDesignProject ? <FiPenTool size={compactCards ? 40 : 56} /> : <FiMonitor size={compactCards ? 40 : 56} />}
          </GalleryItemPlaceholder>
        )}

      </GalleryMedia>


      <GalleryItemContent $compact={compactCards}>
        <GalleryItemHeader>
          <div>
            <GalleryItemTitle>{item.title}</GalleryItemTitle>
            {!compactCards && (
              <GalleryItemStudent>by {item.studentName}</GalleryItemStudent>
            )}
          </div>
          {!compactCards && item.recommendationCount > 0 && (
            <RecommendationBadge title="Recommended by classmates in peer review">
              <FaStar aria-hidden="true" /> {item.recommendationCount}
            </RecommendationBadge>
          )}
        </GalleryItemHeader>
        <GalleryItemDescription>
          {item.description.length > 150
            ? `${item.description.substring(0, 150)}...`
            : item.description
          }
        </GalleryItemDescription>
        {!compactCards && visibleTopics.length > 0 && (
          <GalleryTopicTags aria-label="Guide topics">
            {visibleTopics.map((topic) => (
              <GalleryTopicTag key={topic}>#{topic}</GalleryTopicTag>
            ))}
            {hiddenTopics.length > 0 && (
              <GalleryTopicMore
                tabIndex={0}
                aria-label={`${hiddenTopics.length} more topics: ${hiddenTopics.join(", ")}`}
              >
                +{hiddenTopics.length}
                <GalleryTopicPopover aria-hidden="true">
                  {hiddenTopics.map((topic) => (
                    <GalleryTopicTag key={topic}>#{topic}</GalleryTopicTag>
                  ))}
                </GalleryTopicPopover>
              </GalleryTopicMore>
            )}
          </GalleryTopicTags>
        )}
        <GalleryLinks item={item} compactCards={compactCards} />
      </GalleryItemContent>
    </GalleryItemContainer>
  );
};

export default GalleryItem;
