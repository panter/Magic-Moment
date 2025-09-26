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
            ? "flex min-w-[200px] flex-col space-y-1"
            : "flex border-gray-200 border-b"
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
                ? `flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? "border-yellow-500 border-l-4 bg-yellow-100 text-yellow-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                : `relative flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? "-mb-[2px] border-yellow-500 border-b-2 text-yellow-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
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

export function TabPanel({ children, className = "" }: TabPanelProps) {
  return <div className={className}>{children}</div>;
}
