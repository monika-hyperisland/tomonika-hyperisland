import { fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "app/components/gallery/Gallery";
import { getModuleNumber } from "app/components/gallery/moduleNumber";
import type { GalleryItem } from "app/serverActions/getGallery";

describe("getModuleNumber", () => {
  it("uses module.number when it is there", () => {
    expect(getModuleNumber({ number: 2, title: "2 - Layouts" })).toBe(2);
  });

  it("reads the number from the title when module.number is missing", () => {
    expect(getModuleNumber({ title: "1 - Introductory Course" })).toBe(1);
    expect(getModuleNumber({ title: "12 - Final Project" })).toBe(12);
  });

  it("returns undefined when the title has no number", () => {
    expect(getModuleNumber({ title: "Introductory Course" })).toBeUndefined();
  });
});

// The real site sends modules with a title only, no number.
const realItem = (returnId: string, title: string, moduleTitle: string) =>
  ({
    returnId,
    title,
    description: "",
    studentName: "Student",
    module: { title: moduleTitle },
    guideTitle: "Guide",
    recommendationCount: 1,
    returnImage: "https://example.com/image.png",
    returnGif: null,
    returnUrl: null,
    projectUrl: null,
    liveVersion: null,
    topics: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  }) as unknown as GalleryItem;

describe("Gallery with real data (no module.number)", () => {
  const items = [
    realItem("1", "Coffy Home", "1 - Introductory Course"),
    realItem("2", "Aurum Gym", "3 - The fundamentals"),
    realItem("3", "Cafe 4 U", "1 - Introductory Course"),
  ];

  beforeEach(() => localStorage.clear());

  it("shows the module number on the card badge", () => {
    render(<Gallery items={items} />);
    expect(screen.getAllByText("Module 1")).toHaveLength(2);
    expect(screen.getByText("Module 3")).toBeInTheDocument();
  });

  it("lists each module once, by title, and filters by it", () => {
    render(<Gallery items={items} showControls />);

    fireEvent.click(screen.getByLabelText("Filter by module"));
    const options = within(
      screen.getByRole("group", { name: "Filter by module options" })
    );
    expect(options.getByLabelText("1 - Introductory Course")).toBeInTheDocument();
    expect(options.getByLabelText("3 - The fundamentals")).toBeInTheDocument();

    fireEvent.click(options.getByLabelText("3 - The fundamentals"));
    expect(screen.queryByText("Coffy Home")).not.toBeInTheDocument();
    expect(screen.getByText("Aurum Gym")).toBeInTheDocument();
  });
});
