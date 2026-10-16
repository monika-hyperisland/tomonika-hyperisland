/**
 * The module's number, for labels, colours and sorting.
 *
 * Real guides have no `module.number`, only a title that starts with it
 * ("1 - Introductory Course"), so the number is read from the title when it
 * is missing. Seed data has both, which is why this only shows up on the real
 * site.
 */
export const getModuleNumber = (module: {
  number?: number | null;
  title: string;
}): number | undefined => {
  if (module.number) return module.number;
  const match = module.title.match(/^(\d+)/);
  return match ? Number(match[1]) : undefined;
};
