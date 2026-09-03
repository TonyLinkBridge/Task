"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { HelpCategory } from "../content/types";
import { HelpTableOfContents } from "./table-of-contents";

// Adapted from GitBook's mobile TableOfContents side sheet.
export function HelpMobileNavigation({
  navigation,
  currentSlug,
}: {
  navigation: HelpCategory[];
  currentSlug: string;
}) {
  return (
    <div className="mb-5 lg:hidden">
      <Sheet>
        <SheetTrigger render={<Button type="button" variant="outline" />}>
          打开文章目录
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(90vw,22rem)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>文章目录</SheetTitle>
            <SheetDescription>选择要查看的帮助文章。</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <HelpTableOfContents navigation={navigation} currentSlug={currentSlug} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
