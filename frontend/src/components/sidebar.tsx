import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Cloud,
  HardDrive,
  Tag,
  ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { QuotaBadge } from "./quota-badge";
import { useAuth } from "./auth-provider";
import { getFileIconColor } from "../lib/utils/file-utils";
import { cn } from "../lib/utils";
import { FileItem } from "../lib/types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentSource: "onedrive" | "blob" | "recycle" | "transfer";
  onFilterChange?: (filter: string | null) => void;
}

export function Sidebar({
  isOpen,
  currentSource,
  onFilterChange,
}: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    sources: true,
    filters: true,
    tags: false,
  });
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sources = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      active: location.pathname === "/",
    },
    {
      name: "Azure Storage",
      icon: HardDrive,
      href: "/blob",
      active: location.pathname.startsWith("/blob"),
    },
  ];

  const filters = [
    {
      name: "Images",
      icon: ImageIcon,
      count: 0,
      color: getFileIconColor({
        id: "",
        name: "x.jpg",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: "",
      } as FileItem),
    },
    {
      name: "Documents",
      icon: FileText,
      count: 0,
      color: getFileIconColor({
        id: "",
        name: "x.pdf",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: "",
      } as FileItem),
    },
    {
      name: "Videos",
      icon: Video,
      count: 0,
      color: getFileIconColor({
        id: "",
        name: "x.mp4",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: "",
      } as FileItem),
    },
    {
      name: "Audio",
      icon: Music,
      count: 0,
      color: getFileIconColor({
        id: "",
        name: "x.mp3",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: "",
      } as FileItem),
    },
    {
      name: "Archives",
      icon: Archive,
      count: 0,
      color: getFileIconColor({
        id: "",
        name: "x.zip",
        type: "file",
        size: 0,
        lastModified: new Date(),
        path: "",
      } as FileItem),
    },
  ];

  const tags = [
    { name: "Important", color: "bg-red-500", count: 5 },
    { name: "Work", color: "bg-blue-500", count: 12 },
    { name: "Personal", color: "bg-green-500", count: 8 },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  UniDrive
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.username}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {/* Sources Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("sources")}
                className={cn(
                  "flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
                  !isOpen && "justify-center"
                )}
              >
                {isOpen ? (
                  <>
                    {expandedSections.sources ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Sources</span>
                  </>
                ) : (
                  <Home className="w-4 h-4" />
                )}
              </button>

              {(expandedSections.sources || !isOpen) && (
                <div className="mt-2 space-y-1">
                  {sources.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                        item.active
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700",
                        !isOpen && "justify-center px-2"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {isOpen && <span>{item.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Filters Section */}
            {isOpen && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("filters")}
                  className="flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {expandedSections.filters ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>File Types</span>
                </button>

                {expandedSections.filters && (
                  <div className="mt-2 space-y-1">
                    {filters.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          const next =
                            selectedFilter === item.name ? null : item.name;
                          setSelectedFilter(next);
                          onFilterChange?.(next);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors",
                          selectedFilter === item.name
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags Section */}
            {isOpen && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("tags")}
                  className="flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {expandedSections.tags ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Tag className="w-4 h-4" />
                  <span>Tags</span>
                </button>

                {expandedSections.tags && (
                  <div className="mt-2 space-y-1">
                    {tags.map((tag) => (
                      <button
                        key={tag.name}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn("w-3 h-3 rounded-full", tag.color)}
                          />
                          <span>{tag.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {tag.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          {isOpen && <QuotaBadge />}

          <button
            onClick={logout}
            className={cn(
              "w-full mt-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
              !isOpen && "px-2"
            )}
          >
            {isOpen ? "Sign Out" : "⏻"}
          </button>
        </div>
      </div>
    </div>
  );
}


// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { Home, Cloud, HardDrive, Tag, ImageIcon, FileText, Video, Music, Archive, ChevronDown, ChevronRight } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { getFileIconColor } from "@/lib/utils/file-utils"
// import { QuotaBadge } from "./quota-badge"
// import { useAuth } from "./auth-provider"
// import type { FileItem } from "@/lib/types"

// interface SidebarProps {
//   isOpen: boolean
//   onToggle: () => void
//   currentSource: "onedrive" | "blob" | "recycle" | "transfer"
//   onFilterChange?: (filter: string | null) => void
// }

// export function Sidebar({ isOpen, currentSource, onFilterChange }: SidebarProps) {
//   const pathname = usePathname()
//   const { user, logout } = useAuth()
//   const [expandedSections, setExpandedSections] = useState({
//     sources: true,
//     filters: true,
//     tags: false,
//   })
//   const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

//   const toggleSection = (section: keyof typeof expandedSections) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [section]: !prev[section],
//     }))
//   }

//   const sources = [
//     {
//       name: "Home",
//       icon: Home,
//       href: "/",
//       active: pathname === "/",
//     },
//     {
//       name: "Azure Storage",
//       icon: HardDrive,
//       href: "/blob",
//       active: pathname.startsWith("/blob"),
//     },
//   ]

//   const filters = [
//     {
//       name: "Images",
//       icon: ImageIcon,
//       count: 0,
//       color: getFileIconColor({
//         id: "",
//         name: "x.jpg",
//         type: "file",
//         size: 0,
//         lastModified: new Date(),
//         path: "",
//       } as FileItem),
//     },
//     {
//       name: "Documents",
//       icon: FileText,
//       count: 0,
//       color: getFileIconColor({
//         id: "",
//         name: "x.pdf",
//         type: "file",
//         size: 0,
//         lastModified: new Date(),
//         path: "",
//       } as FileItem),
//     },
//     {
//       name: "Videos",
//       icon: Video,
//       count: 0,
//       color: getFileIconColor({
//         id: "",
//         name: "x.mp4",
//         type: "file",
//         size: 0,
//         lastModified: new Date(),
//         path: "",
//       } as FileItem),
//     },
//     {
//       name: "Audio",
//       icon: Music,
//       count: 0,
//       color: getFileIconColor({
//         id: "",
//         name: "x.mp3",
//         type: "file",
//         size: 0,
//         lastModified: new Date(),
//         path: "",
//       } as FileItem),
//     },
//     {
//       name: "Archives",
//       icon: Archive,
//       count: 0,
//       color: getFileIconColor({
//         id: "",
//         name: "x.zip",
//         type: "file",
//         size: 0,
//         lastModified: new Date(),
//         path: "",
//       } as FileItem),
//     },
//   ]

//   const tags = [
//     { name: "Important", color: "bg-red-500", count: 5 },
//     { name: "Work", color: "bg-blue-500", count: 12 },
//     { name: "Personal", color: "bg-green-500", count: 8 },
//   ]

//   return (
//     <div
//       className={cn(
//         "fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30",
//         isOpen ? "w-64" : "w-16",
//       )}
//     >
//       <div className="flex flex-col h-full">
//         {/* Header */}
//         <div className="p-4 border-b border-gray-200 dark:border-slate-700">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
//               <Cloud className="w-5 h-5 text-white" />
//             </div>
//             {isOpen && (
//               <div>
//                 <h1 className="font-semibold text-gray-900 dark:text-white">UniDrive</h1>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.username}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Navigation */}
//         <div className="flex-1 overflow-y-auto custom-scrollbar">
//           <div className="p-2">
//             {/* Sources Section */}
//             <div className="mb-6">
//               <button
//                 onClick={() => toggleSection("sources")}
//                 className={cn(
//                   "flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
//                   !isOpen && "justify-center",
//                 )}
//               >
//                 {isOpen ? (
//                   <>
//                     {expandedSections.sources ? (
//                       <ChevronDown className="w-4 h-4" />
//                     ) : (
//                       <ChevronRight className="w-4 h-4" />
//                     )}
//                     <span>Sources</span>
//                   </>
//                 ) : (
//                   <Home className="w-4 h-4" />
//                 )}
//               </button>

//               {(expandedSections.sources || !isOpen) && (
//                 <div className="mt-2 space-y-1">
//                   {sources.map((item) => (
//                     <Link
//                       key={item.name}
//                       href={item.href}
//                       className={cn(
//                         "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
//                         item.active
//                           ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
//                           : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700",
//                         !isOpen && "justify-center px-2",
//                       )}
//                     >
//                       <item.icon className="w-4 h-4 flex-shrink-0" />
//                       {isOpen && <span>{item.name}</span>}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Filters Section */}
//             {isOpen && (
//               <div className="mb-6">
//                 <button
//                   onClick={() => toggleSection("filters")}
//                   className="flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                 >
//                   {expandedSections.filters ? (
//                     <ChevronDown className="w-4 h-4" />
//                   ) : (
//                     <ChevronRight className="w-4 h-4" />
//                   )}
//                   <span>File Types</span>
//                 </button>

//                 {expandedSections.filters && (
//                   <div className="mt-2 space-y-1">
//                     {filters.map((item) => (
//                       <button
//                         key={item.name}
//                         onClick={() => {
//                           const next = selectedFilter === item.name ? null : item.name
//                           setSelectedFilter(next)
//                           onFilterChange?.(next)
//                         }}
//                         className={cn(
//                           "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors",
//                           selectedFilter === item.name
//                             ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
//                             : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
//                         )}
//                       >
//                         <div className="flex items-center gap-3">
//                           <item.icon className={`w-4 h-4 ${item.color}`} />
//                           <span>{item.name}</span>
//                         </div>
//                         <span className="text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Tags Section */}
//             {isOpen && (
//               <div className="mb-6">
//                 <button
//                   onClick={() => toggleSection("tags")}
//                   className="flex items-center gap-2 w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                 >
//                   {expandedSections.tags ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
//                   <Tag className="w-4 h-4" />
//                   <span>Tags</span>
//                 </button>

//                 {expandedSections.tags && (
//                   <div className="mt-2 space-y-1">
//                     {tags.map((tag) => (
//                       <button
//                         key={tag.name}
//                         className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                       >
//                         <div className="flex items-center gap-3">
//                           <div className={cn("w-3 h-3 rounded-full", tag.color)} />
//                           <span>{tag.name}</span>
//                         </div>
//                         <span className="text-xs text-gray-500 dark:text-gray-400">{tag.count}</span>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-200 dark:border-slate-700">
//           {isOpen && <QuotaBadge />}

//           <button
//             onClick={logout}
//             className={cn(
//               "w-full mt-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
//               !isOpen && "px-2",
//             )}
//           >
//             {isOpen ? "Sign Out" : "⏻"}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
