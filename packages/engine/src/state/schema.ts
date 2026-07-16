import { z } from "zod";

export const FeatureSchema = z.object({
  name: z.string().default(""),
  specSeed: z.string().default(""),
  dependsOn: z.array(z.string()).default([]),
});

export const ProjectStateSchema = z.object({
  meta: z
    .object({
      name: z.string().default(""),
      description: z.string().default(""),
      specDate: z.string().default(""),
      useGit: z.boolean().default(true),
    })
    .default({}),
  domain: z
    .object({
      projectType: z.string().default(""),
      useCases: z.array(z.string()).default([]),
      nonGoals: z.array(z.string()).default([]),
    })
    .default({}),
  arch: z
    .object({
      stack: z.string().default(""),
      style: z.string().default(""),
    })
    .default({}),
  quality: z
    .object({
      testStrategy: z.string().default(""),
      coverageTarget: z.number().min(0).max(100).default(80),
      ci: z.boolean().default(true),
    })
    .default({}),
  security: z
    .object({
      threatModel: z.string().default(""),
      gates: z.array(z.string()).default([]),
    })
    .default({}),
  features: z.array(FeatureSchema).default([]),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;
export type Feature = z.infer<typeof FeatureSchema>;

export function parseState(
  input: unknown,
):
  | { success: true; data: ProjectState }
  | { success: false; error: z.ZodError } {
  const r = ProjectStateSchema.safeParse(input);
  return r.success
    ? { success: true, data: r.data }
    : { success: false, error: r.error };
}
