import { auth } from "../../../auth";
import { StudentHomePage } from "../../components/studentHome/StudentHomePage";
import { TeacherHomePage } from "../../components/teacherHome/TeacherHomePage";
import { Module } from "../../../types/guideTypes";
import { getGuides } from "../../serverActions/getGuides";
import { getMySubmittedProjects } from "../../serverActions/getGallery";
import { getGroupProjects } from "../../serverActions/groups/getGroupProjects";
import { extendGuides, fetchModules } from "../../utils/guideUtils";
import { safeSerialize } from "../../utils/serialization";
import { EmptyState, ErrorState } from "UIcomponents/states/States";
import { Session } from "next-auth";
import { redirect } from 'next/navigation';

const Dashboard = async () => {
  const session: Session | null = await auth();
  
  
  // Let middleware handle authentication, but still check for safety
  if (!session?.user?.id) {
    return (
      <div>
        <h1>Authentication Required</h1>
        <p>Please sign in to access the dashboard.</p>
      </div>
    );
  }

  // The teacher dashboard is a set of shortcuts and a grading queue — it reads
  // none of the guide data, so don't pay to fetch, extend and serialize it.
  if (session.user.role === "teacher") {
    return <TeacherHomePage />;
  }

  // Authenticated user - show personalized home page based on role
  try {
    const [fetchedGuides, groupProjects, submittedProjects] = await Promise.all([
      getGuides(session.user.id).then((guides) => guides || []),
      getGroupProjects(),
      getMySubmittedProjects(),
    ]);
    const extendedGuides = await extendGuides(fetchedGuides);

    if (extendedGuides.length < 1) {
      return (
        <EmptyState
          title="Welcome!"
          message="Your dashboard will fill up once guides are published — check back soon."
        />
      );
    }

    const modules: Module[] = await fetchModules(extendedGuides);

    // Serialize the data before passing to client component
    const serializedGuides = safeSerialize(extendedGuides);
    const serializedModules = safeSerialize(modules);

    return (
      <StudentHomePage
        extendedGuides={serializedGuides}
        modules={serializedModules}
        groupProjects={groupProjects}
        submittedProjects={submittedProjects}
      />
    );
  } catch (error) {
    console.error("Error in home page:", error);
    return (
      <ErrorState message="We couldn't load your dashboard. Please refresh the page — and if it keeps happening, let a teacher know." />
    );
  }
};

export default Dashboard;