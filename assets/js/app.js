import { initTheme } from "./theme.js";
import { setFooterYear } from "./ui.js";
import { initSearch } from "./search.js";
import { initMobileMenu } from "./modules/mobile-menu.js";
import { initAdminAccountMenu } from "./modules/menu.js";
import { initThemeBranding } from "./modules/theme-branding.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initThemeBranding();
  setFooterYear();
  initSearch();
  initMobileMenu();
  initAdminAccountMenu();
});
