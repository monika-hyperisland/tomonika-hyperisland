'use client';

import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import GalleryItem from "./GalleryItem";
import { GalleryGrid, GalleryEmpty, GallerySearch, SearchWrapper } from "./styles";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";

interface GalleryProps {
  items: GalleryItemType[];
}

const Gallery = ({ items }: GalleryProps) => {
  const [query, setQuery] = useState("");
  if (!items || items.length === 0) {
    return (
      <GalleryEmpty>
        <h3>Gallery Coming Soon</h3>
        <p>Featured student projects will be displayed here once they are recommended by peers.</p>
      </GalleryEmpty>
    );
  }

  const search = query.trim().toLocaleLowerCase();
  const filteredItems = items.filter((item) =>
    item.title.toLocaleLowerCase().includes(search) ||
    item.studentName.toLocaleLowerCase().includes(search) ||
    item.module.title.toLocaleLowerCase().includes(search)
  );

  return (
    <>
      <SearchWrapper>
        <FiSearch size={18} aria-hidden="true" />
        <GallerySearch
          type="search"
          placeholder="Search by project, student or module"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SearchWrapper>

      {filteredItems.length === 0 ? (
        <GalleryEmpty>
          <p>No projects match "{query}"</p>
        </GalleryEmpty>
      ) : (
        <GalleryGrid>
          {filteredItems.map((item) => (
            <GalleryItem key={item.returnId} item={item} />
          ))}
        </GalleryGrid>
      )}
    </>
  );
};

export default Gallery;

