export const menuKeys = {
  all: ["menu"] as const,
  config: () => [...menuKeys.all, "config"] as const,
};
