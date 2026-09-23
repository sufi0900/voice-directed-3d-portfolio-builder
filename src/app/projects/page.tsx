import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectDashboard } from "./project-dashboard";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("projects").select("id,name,creation_mode,template_id,revision,updated_at,variant_of_project_id,source_revision,opportunity_status").order("updated_at", { ascending: false });
  const ids = (data ?? []).map((project) => project.id);
  const { data: publications } = ids.length ? await supabase.from("project_publications").select("project_id,slug,revision,published_at").in("project_id", ids).is("superseded_at", null) : { data: [] };
  const liveByProject = new Map((publications ?? []).map((item) => [item.project_id, item]));
  const projects = (data ?? []).map((project) => ({ ...project, publication: liveByProject.get(project.id) ?? null }));
  return <ProjectDashboard projects={projects} email={user.email ?? "Signed in"} />;
}
