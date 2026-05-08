"use client";

import * as React from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CameraIcon,
  ChartBarIcon,
  CircleHelpIcon,
  CommandIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
  FileTextIcon,
} from "lucide-react";

const navigation = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Aplikacje",
      url: "/applications",
      icon: <FileTextIcon />,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: <ListIcon />,
    },
    {
      title: "Analityka",
      url: "#",
      icon: <ChartBarIcon />,
    },
    {
      title: "Projekty",
      url: "#",
      icon: <FolderIcon />,
    },
    {
      title: "Zespol",
      url: "#",
      icon: <UsersIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Ustawienia",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Pomoc",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Szukaj",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Biblioteka danych",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Raporty",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Asystent dokumentow",
      url: "#",
      icon: <FileIcon />,
    },
    {
      name: "Zrodla wejscia",
      url: "#",
      icon: <CameraIcon />,
    },
  ],
};

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar: string;
  organizationName?: string | null;
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">
                {user.organizationName || "CI-PRS"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
        <NavDocuments items={navigation.documents} />
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
