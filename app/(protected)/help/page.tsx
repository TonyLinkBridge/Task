import { HelpHome } from "@/features/help-center/components/help-home";
import {
  getHelpArticles,
  getHelpNavigation,
} from "@/features/help-center/content/registry";

export default function HelpCenterPage() {
  return (
    <HelpHome
      articles={getHelpArticles()}
      navigation={getHelpNavigation()}
    />
  );
}
