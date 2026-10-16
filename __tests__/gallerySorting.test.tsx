import { fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "../app/components/gallery/Gallery";
import type { GalleryItem } from "../app/serverActions/getGallery";

jest.mock("../app/components/gallery/GalleryItem", () => ({
  __esModule: true,
  default: ({ item }: { item: GalleryItem }) => <div data-testid="project">{item.title}</div>,
}));
const item = (returnId: string, title: string, year: string, module: number, url: string, votes: number): GalleryItem => ({
  returnId, title, studentName: "Raheel", description: "", module: {title: "Module " + module, number: module},
  guideTitle: "", recommendationCount: votes, createdAt: year + "-01-01", returnImage: null, returnGif: null,
  returnUrl: url, projectUrl: null, liveVersion: null, topics: [],
});
const items = [
  item("a", "Old web", "2025", 1, "https://example.com/old", 10),
  item("b", "New design", "2026", 2, "https://figma.com/design/demo", 1),
  item("c", "New web", "2026", 3, "https://example.com/new", 5),
];
const titles = () => screen.getAllByTestId("project").map(node => node.textContent);
const choose = (filter: string, option: string) => {
  fireEvent.click(screen.getByLabelText("Filter by " + filter));
  fireEvent.click(within(screen.getByRole("group", {name: "Filter by " + filter + " options"})).getByLabelText(option));
};
beforeEach(() => localStorage.clear());

test("Clear all is hidden by default and for search alone, but appears for sorting", () => {
  render(<Gallery showControls items={items} />);
  expect(screen.queryByRole("button", {name: "Clear all"})).not.toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Search by project, student or module"), {target: {value: "web"}});
  expect(screen.queryByRole("button", {name: "Clear all"})).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Sort by"), {target: {value: "newest"}});
  expect(titles()).toEqual(["New web", "Old web"]);
  fireEvent.click(screen.getByRole("button", {name: "Clear all"}));
  expect(titles()).toEqual(["Old web", "New web", "New design"]);
  expect(screen.queryByRole("button", {name: "Clear all"})).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("Search by project, student or module")).toHaveValue("");
});

test("multiple values within each filter are combined with OR, and filter groups with AND", () => {
  render(<Gallery showControls items={items} />);
  choose("module", "Module 1");
  choose("module", "Module 2");
  expect(titles()).toEqual(["Old web", "New design"]);
  choose("category", "Web");
  expect(titles()).toEqual(["Old web"]);
  choose("category", "Design");
  choose("year", "2025");
  expect(titles()).toEqual(["Old web"]);
  choose("year", "2026");
  expect(titles()).toEqual(["Old web", "New design"]);
  fireEvent.change(screen.getByLabelText("Sort by"), {target: {value: "newest"}});
  expect(titles()).toEqual(["New design", "Old web"]);
  fireEvent.click(screen.getByRole("button", {name: "Clear all"}));
  expect(titles()).toEqual(["Old web", "New web", "New design"]);
  expect(screen.queryByRole("button", {name: "Clear all"})).not.toBeInTheDocument();
});

test("All modules removes selections and hides Clear all when sorting is default", () => {
  render(<Gallery showControls items={items} />);
  choose("module", "Module 1");
  expect(screen.getByRole("button", {name: "Clear all"})).toBeInTheDocument();
  choose("module", "All modules");
  expect(titles()).toHaveLength(3);
  expect(screen.queryByRole("button", {name: "Clear all"})).not.toBeInTheDocument();
});
