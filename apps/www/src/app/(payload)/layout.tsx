import "./custom.scss";
import { RootLayout } from "@payloadcms/next/layouts";
import type React from "react";
import config from "@payload-config";
import { importMap } from "./admin/importMap";

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => {
  return (
    <RootLayout config={config} importMap={importMap}>
      {children}
    </RootLayout>
  );
};

export default Layout;
