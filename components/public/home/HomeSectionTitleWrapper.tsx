"use client";

import dynamic from "next/dynamic";

// Lazy load HomeSectionTitle (contient framer-motion)
const HomeSectionTitle = dynamic(
  () => import("./HomeSectionTitle").then((mod) => ({ default: mod.HomeSectionTitle })),
  { ssr: false }
);

type HomeSectionTitleWrapperProps = {
  title: string;
  description: string;
};

export function HomeSectionTitleWrapper({ title, description }: HomeSectionTitleWrapperProps) {
  return <HomeSectionTitle title={title} description={description} />;
}

