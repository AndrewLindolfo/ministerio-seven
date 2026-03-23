import { $, $$ } from "../utils.js";
import { logout, watchAuth } from "../auth.js";

function fillAdminUser(user) {
  const emailEls = $$("#admin-user-email");
  const photoEls = $$("#admin-user-photo");

  emailEls.forEach((el) => {
    el.textContent = user?.email || "";
  });

  photoEls.forEach((el) => {
    if (user?.photoURL) {
      el.src = user.photoURL;
    } else {
      el.src = "../assets/img/v7/icon_120.png";
    }

    el.alt = user?.displayName || user?.email || "Conta";
  });
}

export function initAdminAccountMenu() {
  const toggle = $("#admin-account-toggle");
  const menu = $("#admin-account-menu");
  const logoutButton = $("#admin-logout-button");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.classList.add("hidden");
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await logout();
    });
  }

  watchAuth((user) => {
    if (user) {
      fillAdminUser(user);
    }
  });
}
