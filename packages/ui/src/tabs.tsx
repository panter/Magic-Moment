"use client";

import { type ReactNode, useState } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

interface TabPanelProps {
  tabId: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  children,
  className = "",
  orientation = "horizontal",
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const isVertical = orientation === "vertical";

  return (
    <div className={`${isVertical ? "flex gap-6" : ""} ${className}`}>
      <div
        className={`${
          isVertical
            ? "flex flex-col space-y-1 min-w-[200px]"
            : "flex space-x-1 border-b border-gray-200"
        }`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`${
              isVertical
                ? `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`
                : `px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "text-yellow-900 border-yellow-500"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  }`
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.icon && (
              <span className={isVertical ? "" : "inline-block mr-2"}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className={isVertical ? "flex-1" : "mt-6"}>
        {Array.isArray(children)
          ? children.map((child: React.ReactElement<TabPanelProps>) => {
              if (child?.props?.tabId === activeTab) {
                return (
                  <div
                    key={child.props.tabId}
                    role="tabpanel"
                    id={`panel-${child.props.tabId}`}
                    aria-labelledby={`tab-${child.props.tabId}`}
                  >
                    {child}
                  </div>
                );
              }
              return null;
            })
          : children}
      </div>
    </div>
  );
}

export function TabPanel({ tabId, children, className = "" }: TabPanelProps) {
  return <div className={className}>{children}</div>;
}
