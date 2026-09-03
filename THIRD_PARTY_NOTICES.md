# 第三方代码说明

## GitBook

本项目的内部帮助中心采用并修改了 GitBook 开源前台的部分代码。

- 原项目：<https://github.com/GitbookIO/gitbook>
- 用户提供的来源：`/Users/tony/Downloads/gitbook-main/`
- 原授权：GNU General Public License version 3
- 修改开始日期：2026-09-03

采用范围只限内部帮助中心的目录、文章显示、搜索、移动目录、面包屑、页尾导航、主题、公告、页脚、封面、标签、反馈、PDF、丰富内容、数学公式、流程图和响应式显示。

目前已经采用和修改的 GitBook 源文件：

- `packages/gitbook/src/components/Announcement/Announcement.tsx`
- `packages/gitbook/src/components/Announcement/AnnouncementBanner.tsx`
- `packages/gitbook/src/components/Footer/Footer.tsx`
- `packages/gitbook/src/components/PageBody/PageBody.tsx`
- `packages/gitbook/src/components/PageBody/PageCover.tsx`
- `packages/gitbook/src/components/PageBody/PageTags.tsx`
- `packages/gitbook/src/components/PageBody/BreadcrumbItemDropdown.tsx`
- `packages/gitbook/src/components/PageBody/PageFooterNavigation.tsx`
- `packages/gitbook/src/components/PageAside/PageAside.tsx`
- `packages/gitbook/src/components/PageAside/ScrollSectionsList.tsx`
- `packages/gitbook/src/components/PageAside/ScrollToTopButton.tsx`
- `packages/gitbook/src/components/TableOfContents/TableOfContents.tsx`
- `packages/gitbook/src/components/TableOfContents/PagesList.tsx`
- `packages/gitbook/src/components/TableOfContents/PageLinkItem.tsx`

完整 GPLv3 文本位于 `licenses/GitBook-GPL-3.0.txt`。
