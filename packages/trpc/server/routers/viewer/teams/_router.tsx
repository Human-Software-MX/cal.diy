import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZCreateTeamInputSchema } from "./create.schema";
import { ZGetTeamInputSchema } from "./get.schema";
import { ZInviteMemberInputSchema } from "./inviteMember.schema";
import { ZListMembersInputSchema } from "./listMembers.schema";
import { ZRemoveMemberInputSchema } from "./removeMember.schema";
import { ZUpdateTeamInputSchema } from "./update.schema";

// Router propio de equipos para cal.diy (reimplementación desde cero, TSK-45).
// Opera sobre los modelos Prisma Team/Membership ya existentes. No depende del
// código EE de teams de cal.com.
export const teamsRouter = router({
  // Equipos (no-organización) donde el usuario es miembro aceptado.
  list: authedProcedure.query(async ({ ctx }) => {
    const { listHandler } = await import("./list.handler");
    return listHandler({ ctx });
  }),

  get: authedProcedure.input(ZGetTeamInputSchema).query(async ({ ctx, input }) => {
    const { getHandler } = await import("./get.handler");
    return getHandler({ ctx, input });
  }),

  create: authedProcedure.input(ZCreateTeamInputSchema).mutation(async ({ ctx, input }) => {
    const { createHandler } = await import("./create.handler");
    return createHandler({ ctx, input });
  }),

  update: authedProcedure.input(ZUpdateTeamInputSchema).mutation(async ({ ctx, input }) => {
    const { updateHandler } = await import("./update.handler");
    return updateHandler({ ctx, input });
  }),

  listMembers: authedProcedure.input(ZListMembersInputSchema).query(async ({ ctx, input }) => {
    const { listMembersHandler } = await import("./listMembers.handler");
    return listMembersHandler({ ctx, input });
  }),

  inviteMember: authedProcedure.input(ZInviteMemberInputSchema).mutation(async ({ ctx, input }) => {
    const { inviteMemberHandler } = await import("./inviteMember.handler");
    return inviteMemberHandler({ ctx, input });
  }),

  removeMember: authedProcedure.input(ZRemoveMemberInputSchema).mutation(async ({ ctx, input }) => {
    const { removeMemberHandler } = await import("./removeMember.handler");
    return removeMemberHandler({ ctx, input });
  }),
});
