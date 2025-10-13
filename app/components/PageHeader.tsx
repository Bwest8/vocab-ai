"use client";

import Header from "./Header";
import type React from "react";

export type PageHeaderProps = React.ComponentProps<typeof Header>;

export default function PageHeader(props: PageHeaderProps) {
  return <Header {...props} />;
}
