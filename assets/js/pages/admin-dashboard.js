import { protectAdminPage } from "../auth-guard.js";
document.addEventListener("DOMContentLoaded", () => { protectAdminPage(); });
