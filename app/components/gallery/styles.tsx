"use client";
import { Background } from "globalStyles/layoutStyles";
import { i } from "node_modules/@vercel/blob/dist/create-folder-BM6BTlko";
import styled from "styled-components";

export const GalleryItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

export const GalleryItemImage = styled.div<{ $compact?: boolean }>`
  width: 100%;
  height: ${({ $compact }) => ($compact ? "128px" : "200px")};
  overflow: hidden;
  background: var(--primary-black-5);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    height: ${({ $compact }) => ($compact ? "144px" : "240px")};
  }
`;

export const GalleryItemContent = styled.div<{ $compact?: boolean }>`
  padding: ${({ $compact }) => ($compact ? "10px" : "20px")};
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? "3px" : "8px")};
  flex: 1;
`;

export const GalleryItemTitle = styled.h3`
  font-family: "Sunflower", sans-serif;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0;
  line-height: 1.3;

  @media (min-width: 768px) {
    font-size: var(--text-xl);
  }
`;

export const GalleryItemStudent = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-module3-100);
  margin: 4px 0 0;
`;

export const GalleryItemDescription = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--primary-black-60);
  margin: 0;
  line-height: 1.5;
  flex: 1;
`;

export const GalleryTopicTags = styled.div`
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
`;

/**
 * Block, not flex: `text-overflow: ellipsis` only works on a block's own text.
 * `min-width: 0` lets a tag shrink below its text width so the row stays on one line.
 */
export const GalleryTopicTag = styled.span`
  display: block;
  min-width: 0;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--primary-black-5);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * The hidden topics, shown as the same chips in a small card above the tag row.
 * Anchored to the whole row (not the "+N" chip) so it never sticks out of the
 * card, which clips with `overflow: hidden`.
 */
export const GalleryTopicPopover = styled.span`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
`;

/** The "+N" chip: never shrinks, and reveals the popover on hover or keyboard focus. */
export const GalleryTopicMore = styled(GalleryTopicTag)`
  position: static;
  flex-shrink: 0;
  overflow: visible;
  cursor: default;

  &:hover ${GalleryTopicPopover},
  &:focus-visible ${GalleryTopicPopover} {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const GalleryActions = styled.div<{
  $multiple: boolean;
  $compact?: boolean;
}>`
  display: flex;
  flex-direction: ${({ $compact }) => ($compact ? "column" : "row")};
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
`;

// A flex item drops its own leading space, so the gap before the arrow is a margin.
export const GalleryActionArrow = styled.span`
  margin-left: 6px;
`;

export const GalleryActionLink = styled.a<{
  $primary: boolean;
  $multiple: boolean;
  $compact?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: ${({ $multiple, $compact }) =>
    $compact ? "0 1 auto" : $multiple ? "1 1 0" : "0 1 auto"};
  min-width: 0;
  width: ${({ $compact }) => ($compact ? "100%" : "auto")};
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 20px;

  @media (min-width: 768px) {
    min-height: 36px;
    padding: 6px 16px;
  }
  border: 1px solid
    ${({ $primary }) =>
    $primary ? "var(--primary-black-100)" : "var(--primary-black-30)"};
  border-radius: var(--radius-lg);
  background: ${({ $primary }) =>
    $primary ? "var(--primary-black-100)" : "var(--primary-white)"};
  color:
    ${({ $primary }) =>
    $primary ? "var(--primary-white)" : "var(--primary-black-100)"};
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  svg {
    flex: none;
    margin-right: 8px;
  }

  &:hover {
    border-color: var(--primary-black-30);
    background: ${({ $primary }) =>
    $primary ? "var(--primary-white)" : "var(--primary-black-100)"};
    color: ${({ $primary }) =>
    $primary ? "var(--primary-black-100)" : "var(--primary-white)"};
  }

  &:focus-visible {
    outline: 3px solid var(--theme-module3-60);
    outline-offset: 2px;
  }
`;

/**
 * auto-fill rather than a hard 4-column cap, so the grid keeps adding columns
 * on a wide screen instead of leaving the right-hand side empty. The track
 * minimum is what decides the count; no breakpoints to keep in sync.
 */
export const GalleryGrid = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $compact }) =>
    $compact
      ? "repeat(auto-fill, minmax(min(240px, 100%), 1fr))"
      : "repeat(auto-fill, minmax(280px, 1fr))"};
  gap: ${({ $compact }) => ($compact ? "13px" : "24px")};
  width: 100%;
  margin: 0;
`;

export const GallerySearch = styled.input`
  padding: 10px 16px 10px 38px;
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-lg);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);

  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px var(--theme-module3-60);
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
  max-width: 800px;
  margin-bottom: 24px;

  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary-black-60);
    pointer-events: none;
  }
`;

export const FilterControls = styled.div`
  position: relative;
  /* Above the cards, so an open dropdown is never painted behind them. */
  z-index: 10;
  display: grid;
  width: 100%;
  max-width: 800px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;

  /* Two columns: the right-hand dropdown opens leftwards so it stays on screen. */
  @media (max-width: 639px) {
    > details:nth-child(2n) > div {
      left: auto;
      right: 0;
    }
  }

  /* Clear all: own right-aligned row on narrow screens, right of Sort from 640px up. */
  > :nth-child(5) {
    grid-column: 1 / -1;
    justify-self: end;
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));

    /* The extra column exists only while Clear all does, so Sort shifts left to make room. */
    &[data-clear-visible="true"] {
      grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    }

    > :nth-child(5) {
      grid-column: auto;
    }
  }
`;
export const FilterSelect = styled.select`
  width: 100%;
  padding: 10px 30px 10px 10px;
  min-height: 44px;
  min-width: 0;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-lg);
  background-color: var(--primary-white);
  /* Custom arrow lets us control exact right spacing across browsers. */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px 8px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px var(--theme-module3-60);
  }
`;

export const GalleryEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--primary-black-60);

  h3 {
    font-family: "Sunflower", sans-serif;
    font-size: var(--text-2xl);
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  p {
    font-family: "Source Sans 3", sans-serif;
    font-size: 14px;
    margin: 0;
  }
`;

// Iframe preview for live websites (zoomed out view)
export const IframePreviewContainer = styled.div<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  height: ${({ $compact }) => ($compact ? "128px" : "200px")};
  overflow: hidden;
  background: var(--primary-black-5);

  iframe {
    width: 400%;
    height: 400%;
    transform: scale(0.25);
    transform-origin: top left;
    border: none;
    pointer-events: none;
  }

  @media (min-width: 768px) {
    height: ${({ $compact }) => ($compact ? "144px" : "240px")};
  }
`;

// Figma thumbnail preview
export const FigmaPreviewContainer = styled.div<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  height: ${({ $compact }) => ($compact ? "128px" : "200px")};
  overflow: hidden;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    height: ${({ $compact }) => ($compact ? "144px" : "240px")};
  }
`;

export const GalleryMedia = styled.div`
  position: relative;
`;

const MODULE_COLORS = ["#3a6ea5", "#b5562a", "#6a4c93", "#2f7d5b", "#a63d6b"];

/** Each module number gets its own colour, cycling through the palette; no number falls back to the theme colour. */
const moduleColor = (module?: number): string =>
  module ? MODULE_COLORS[(module - 1) % MODULE_COLORS.length] : "var(--theme-module3-100)";

export const ModuleBadge = styled.span<{ $module?: number }>`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  padding: 4px 12px;
  border-radius: 999px;
  background: ${({ $module }) => moduleColor($module)};
  color: white;
  font-size: var(--text-xs);
  font-weight: 700;
`;

/** Shown when a project has no image and no preview: same size as an image, in the module's colour. */
export const GalleryItemPlaceholder = styled(GalleryItemImage)<{ $module?: number }>`
  background: ${({ $module }) =>
    `linear-gradient(135deg, ${moduleColor($module)} 0%, color-mix(in srgb, ${moduleColor($module)} 60%, black) 100%)`};

  svg {
    color: rgba(255, 255, 255, 0.7);
  }
`;

export const GalleryItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

export const RecommendationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--primary-black-10);
  font-size: var(--text-xs);
  font-weight: 700;
  flex-shrink: 0;
  svg { color: #e0a100; }
`;

export const GallerySort = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  label {
    flex-shrink: 0;
    font-family: "Source Sans 3", sans-serif;
    font-size: 14px;
  }
`;

export const GalleryReset = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid rgba(120, 100, 220, 0.35);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 4px 16px rgba(80, 60, 160, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms ease, box-shadow 160ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 6px 20px rgba(80, 60, 160, 0.16);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 3px;
  }

  &:active {
    background: rgba(230, 225, 255, 0.8);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
