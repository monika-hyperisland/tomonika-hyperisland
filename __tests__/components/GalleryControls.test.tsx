import { render, screen } from "@testing-library/react";
import Gallery from "app/components/gallery/Gallery";

const sampleItems = [
  {
    returnId: "1",
    title: "Moon Landing",
    description: "A small but ambitious web project showcasing a landing page for a moon mission.",
    studentName: "Anna Student",
    module: { number: 1, title: "Module 1" },
    guideTitle: "Moon mission landing page",
    recommendationCount: 2,
    returnImage: null,
    returnGif: null,
    returnUrl: "https://example.com/project",
    projectUrl: null,
    liveVersion: "https://example.com/project",
    topics: ["html", "css"],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

describe("Gallery controls", () => {
  it("hides search and filters when controls are disabled", () => {
    render(<Gallery items={sampleItems} showControls={false} />);

    expect(screen.queryByPlaceholderText("Search by project, student or module")).toBeNull();
    expect(screen.queryByLabelText("Filter by module")).toBeNull();
  });

  it("shows search and filters when controls are enabled", () => {
    render(<Gallery items={sampleItems} showControls />);

    expect(screen.getByPlaceholderText("Search by project, student or module")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by module")).toBeInTheDocument();
  });

  it("renders compact cards without student, recommendation, or topic details", () => {
    render(<Gallery items={sampleItems} compactCards />);

    expect(screen.getByText("Moon Landing")).toBeInTheDocument();
    expect(screen.queryByText("by Anna Student")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Recommended by classmates in peer review")).not.toBeInTheDocument();
    expect(screen.queryByText("#html")).not.toBeInTheDocument();
    expect(screen.queryByText("#css")).not.toBeInTheDocument();
  });

  it("keeps the standard card details when compact cards are disabled", () => {
    render(<Gallery items={sampleItems} />);

    expect(screen.getByText("by Anna Student")).toBeInTheDocument();
    expect(screen.getByTitle("Recommended by classmates in peer review")).toBeInTheDocument();
    expect(screen.getByText("#html")).toBeInTheDocument();
  });
});
