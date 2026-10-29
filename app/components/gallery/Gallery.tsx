'use client';
import { AppliedGalleryLayout } from "./AppliedGalleryLayout";
import GalleryDevTools from "./GalleryDevTools";

import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import GalleryItem from "./GalleryItem";
import GalleryMultiFilter from "./GalleryMultiFilter";
import ResetIntroduction from "./ResetIntroduction";
import {
  GalleryGrid,
  GalleryEmpty,
  GallerySearch,
  SearchWrapper,
  FilterControls,
  FilterSelect,
  GallerySort,
  GalleryReset,
} from "./styles";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { sortGalleryItems, type GallerySortOrder } from "./sortGalleryItems";
import { getModuleNumber } from "./moduleNumber";

interface GalleryProps {
  items: GalleryItemType[];
  showControls?: boolean;
  compactCards?: boolean;
  userId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultSortOrder?: GallerySortOrder;
}

type CategoryFilter = "all" | "design" | "web" | "other";

const getCategory = (item: GalleryItemType): CategoryFilter => {
  const url = item.returnUrl?.toLocaleLowerCase();

  if (!url) {
    return "other";
  }

  if (url.includes("figma.com/file") || url.includes("figma.com/design") || url.includes("figma.com/proto")) {
    return "design";
  }

  const nonWebsitePatterns = [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "figma.com",
    "docs.google.com",
    "drive.google.com",
  ];

  if (!nonWebsitePatterns.some((pattern) => url.includes(pattern))) {
    return "web";
  }

  return "other";
};

const Gallery = ({
  items,
  showControls = false,
  compactCards = false,
  emptyTitle = "Gallery Coming Soon",
  emptyDescription = "Featured student projects will be displayed here once they are recommended by peers.",
  defaultSortOrder = "recommended",
}: GalleryProps) => {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>(defaultSortOrder);
  const [selectedModule, setSelectedModule] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string[]>([]);

  if (!items || items.length === 0) {
    return (
      <GalleryEmpty>
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </GalleryEmpty>
    );
  }

  // Keyed by title: real guides have no module.number, so a number key would
  // merge every module into one option. The title already carries the number.
  const moduleOptions = [...new Set(items.map((item) => item.module.title))]
    .sort((a, b) =>
      (getModuleNumber({ title: a }) ?? Infinity) - (getModuleNumber({ title: b }) ?? Infinity) ||
      a.localeCompare(b)
    );

  const yearOptions = [...new Set(items.map((item) => new Date(item.createdAt).getFullYear()))]
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a);

  const modules = new Set(selectedModule);
  const categories = new Set(selectedCategory);
  const years = new Set(selectedYear);
  const hasActiveControls = selectedModule.length > 0 || selectedCategory.length > 0 || selectedYear.length > 0 || sortOrder !== "recommended";
  const search = query.trim().toLocaleLowerCase();
  const filteredItems = showControls
    ? items.filter((item) => {
        const matchesSearch =
          item.title.toLocaleLowerCase().includes(search) ||
          item.studentName.toLocaleLowerCase().includes(search) ||
          item.module.title.toLocaleLowerCase().includes(search);

        const matchesModule =
          selectedModule.length === 0 ||
          modules.has(item.module.title);

        const matchesCategory =
          selectedCategory.length === 0 ||
          categories.has(getCategory(item));

        const itemYear = new Date(item.createdAt).getFullYear();
        const matchesYear =
          selectedYear.length === 0 ||
          years.has(String(itemYear));

        return matchesSearch && matchesModule && matchesCategory && matchesYear;
      })
    : items;

  return (
    <AppliedGalleryLayout $enabled={showControls}>
      {showControls && <>
      <GalleryDevTools />
      <SearchWrapper data-gallery-layout="search">
        <FiSearch size={18} aria-hidden="true" />
        <GallerySearch
          type="search"
          placeholder="Search by project, student or module"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SearchWrapper>


      <FilterControls data-gallery-layout="filters" data-clear-visible={hasActiveControls}>
        <GalleryMultiFilter label="Filter by module" allLabel="All modules"
          options={moduleOptions.map((title) => ({ value: title, label: title }))}
          selected={selectedModule} onChange={setSelectedModule} />
        <GalleryMultiFilter label="Filter by category" allLabel="All categories"
          options={[{value: "design", label: "Design"}, {value: "web", label: "Web"}, {value: "other", label: "Other"}]}
          selected={selectedCategory} onChange={setSelectedCategory} />
        <GalleryMultiFilter label="Filter by year" allLabel="All years"
          options={yearOptions.map(year => ({value: String(year), label: String(year)}))}
          selected={selectedYear} onChange={setSelectedYear} />
        <GallerySort data-gallery-layout="sort">
          <label htmlFor="gallery-sort">Sort by</label>
          <FilterSelect
            id="gallery-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as GallerySortOrder)}
          >
            <option value="recommended">Most recommended</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </FilterSelect>
        </GallerySort>
        {hasActiveControls && <ResetIntroduction>
        <GalleryReset
          type="button"
          onClick={() => {
            setQuery("");
            setSelectedModule([]);
            setSelectedCategory([]);
            setSelectedYear([]);
            setSortOrder("recommended");
          }}
        >
          Clear all
        </GalleryReset>
        </ResetIntroduction>}
      </FilterControls>
      </>}

      {showControls && <p data-gallery-layout="count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "project" : "projects"}</p>}

      {filteredItems.length === 0 ? (
        <GalleryEmpty>
          <p>No projects match your current filters.</p>
        </GalleryEmpty>
      ) : (
        <GalleryGrid $compact={compactCards} data-gallery-layout="cards">
          {sortGalleryItems(filteredItems, sortOrder).map((item) => (
            <GalleryItem
              key={item.returnId}
              item={item}
              compactCards={compactCards}
            />
          ))}
        </GalleryGrid>
      )}
    </AppliedGalleryLayout>
  );
};

export default Gallery;
