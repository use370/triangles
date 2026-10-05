import { supabase } from "@/lib/supabase";

type NotificationType =
  | "task"
  | "file"
  | "member"
  | "update";

type CreateNotificationParams = {
  projectId: string;
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
};

export async function createProjectNotification({
  projectId,
  userId,
  actorId = null,
  type,
  title,
  message = null,
}: CreateNotificationParams) {
  if (!userId) {
    return;
  }

  // Don't notify yourself about your own action.
  if (actorId && userId === actorId) {
    return;
  }

  const { error } = await supabase
    .from("project_notifications")
    .insert({
      project_id: projectId,
      user_id: userId,
      actor_id: actorId,
      type,
      title,
      message,
    });

  if (error) {
    console.error(
      "Project notification error:",
      error.message
    );
  }
}