import type { FeatureItem, SettingsItem, PermRule } from "@/lib/api/domains/menu/contract"

function checkPerms(perms: PermRule | undefined, userPerms: string[]): boolean {
  if (!perms || perms.list.length === 0) return true
  const mode = perms.mode ?? "all"
  if (mode === "all") {
    return perms.list.every((p) => userPerms.includes(p))
  }
  return perms.list.some((p) => userPerms.includes(p))
}

function checkDisplay(display: string[] | undefined, userRoles: string[]): boolean {
  if (!display || display.length === 0) return true
  return display.some((role) => userRoles.includes(role))
}

export function filterFeatures(
  features: FeatureItem[],
  userPerms: string[],
  userRoles: string[]
): FeatureItem[] {
  return features.reduce<FeatureItem[]>((acc, item) => {
    if (!checkDisplay(item.display, userRoles)) return acc
    if (!checkPerms(item.perms, userPerms)) return acc

    if (item.submenu && item.submenu.length > 0) {
      const filteredSubmenu = item.submenu.filter((sub) =>
        checkPerms(sub.perms, userPerms)
      )
      if (filteredSubmenu.length === 0) return acc
      acc.push({ ...item, submenu: filteredSubmenu })
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

export function filterSettings(
  settings: SettingsItem[],
  userPerms: string[],
  userRoles: string[]
): SettingsItem[] {
  return settings.filter((item) => {
    if (!checkDisplay(item.display, userRoles)) return false
    if (!checkPerms(item.perms, userPerms)) return false
    return true
  })
}
