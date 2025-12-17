import { getOrganizationHierarchy } from "./actions";
import { HierarchyClient } from "./HierarchyClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HierarchyPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const data = await getOrganizationHierarchy();

  return (
    <main className="relative h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="/videos/9-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <HierarchyClient initialData={data} currentUserRole={session.user.role} />
      </div>
    </main>
  );
}
