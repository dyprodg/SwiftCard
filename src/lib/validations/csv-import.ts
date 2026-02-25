import { z } from "zod";

export const csvImportOptionsSchema = z.object({
  mode: z.enum(["CREATE_ONLY", "UPDATE_ONLY", "CREATE_AND_UPDATE"]),
  dryRun: z.boolean().default(false),
  skipErrors: z.boolean().default(false),
});

export type CsvImportOptions = z.infer<typeof csvImportOptionsSchema>;
