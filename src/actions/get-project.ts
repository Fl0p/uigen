"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertV4MessageToV5 } from "@/lib/convert-messages";

export async function getProject(projectId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Parse messages from database
  const rawMessages = JSON.parse(project.messages);
  
  // Convert v4 messages to v5 format
  const messages = rawMessages.map((msg: any, index: number) => convertV4MessageToV5(msg, index));

  return {
    id: project.id,
    name: project.name,
    messages,
    data: JSON.parse(project.data),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}