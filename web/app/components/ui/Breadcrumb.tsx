"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGuildDetails } from "@/app/contexts/GuildContext";
import { HiChevronRight } from "react-icons/hi2";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive: boolean;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);
  const guildId =
    segments.length >= 2 && segments[0] === "dashboard"
      ? segments[1]
      : undefined;
  const { guildDetails } = useGuildDetails(guildId);
  const currentGuild = guildDetails?.info || null;

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    });

    if (segments.length >= 2 && segments[0] === "dashboard") {
      const guildId = segments[1];

      if (currentGuild) {
        breadcrumbs.push({
          label: currentGuild.name,
          href: `/dashboard/${guildId}`,
          isActive: pathname === `/dashboard/${guildId}`,
        });
      } else {
        breadcrumbs.push({
          label: "Server",
          href: `/dashboard/${guildId}`,
          isActive: pathname === `/dashboard/${guildId}`,
        });
      }

      if (segments.length >= 3) {
        const module = segments[2];
        const moduleLabels: { [key: string]: string } = {
          leveling: "Leveling",
          moderation: "Moderation",
          settings: "Settings",
        };

        breadcrumbs.push({
          label:
            moduleLabels[module] ||
            module.charAt(0).toUpperCase() + module.slice(1),
          href: `/dashboard/${guildId}/${module}`,
          isActive: true,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleBreadcrumbClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <HiChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
          )}
          {breadcrumb.isActive ? (
            <span className="text-white font-medium select-none">
              {breadcrumb.label}
            </span>
          ) : (
            <button
              onClick={() => handleBreadcrumbClick(breadcrumb.href)}
              className="transition-colors duration-150 cursor-pointer text-neutral-400 hover:text-white select-none"
            >
              {breadcrumb.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
