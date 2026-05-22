import type { Metadata } from "next";

import { CopyDemo } from "@/components/copy-demo/copy-demo";

export const metadata: Metadata = {
  title: "Demo komponentu CopyButton",
};

export default function CopyDemoPage() {
  return <CopyDemo />;
}
