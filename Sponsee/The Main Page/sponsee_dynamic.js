(function () {
  const API_BASE = "/api/sponsee";
  const PHONE_KEY = "sponzobd.sponsee.phone";

  function getPhoneFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get("phone") || "";
  }

  function getCurrentPhone() {
    const fromUrl = getPhoneFromUrl();
    if (fromUrl) {
      localStorage.setItem(PHONE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = localStorage.getItem(PHONE_KEY);
    if (stored) {
      return stored;
    }
    return "demo-user";
  }

  function getViewedProfilePhone(currentPhone) {
    if (!window.location.pathname.includes("sponsee Profile.html")) {
      return currentPhone;
    }
    const url = new URL(window.location.href);
    return url.searchParams.get("profilePhone") || currentPhone;
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  function setAvatarInitials(name) {
    if (!name) return;
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

    [".av", ".av-s", ".av-sb"].forEach((selector) =>
      setText(selector, initials),
    );
  }

  function applyUser(snapshot) {
    const user = snapshot?.user;
    const stats = snapshot?.stats;
    const counts = snapshot?.counts;
    if (!user) return;

    const subtitle = `${user.category || "Creator"} · ${user.followers || "0"}`;
    setText(".u-name", user.displayName || "Creator");
    setText(".u-sub", subtitle);
    setText(".u-niche", subtitle);
    setAvatarInitials(user.displayName || "Creator");

    if (stats?.profileStrength) {
      setText(".ps-pct", `${stats.profileStrength}%`);
      document.querySelectorAll(".ps-fill").forEach((el) => {
        el.style.width = `${stats.profileStrength}%`;
      });
      setText(".str-pct", `${stats.profileStrength}%`);
      document.querySelectorAll(".str-fill").forEach((el) => {
        el.style.width = `${stats.profileStrength}%`;
      });
    }

    if (counts?.unreadMessages !== undefined) {
      document.querySelectorAll(".ni-badge").forEach((badge) => {
        badge.textContent = String(counts.unreadMessages);
      });
    }

    if (window.location.pathname.includes("sponsee Profile.html")) {
      setText(".ib-name", user.displayName || "Creator");
      const sub = `${user.category || "Creator"} content creator · ${
        user.location || "Bangladesh"
      }`;
      setText(".ib-sub", sub);
    }
  }

  function bindNavWithPhone(phone) {
    document.querySelectorAll(".nav .ni[onclick]").forEach((item) => {
      const onclick = item.getAttribute("onclick") || "";
      const match = onclick.match(/window\.location\.href\s*=\s*'([^']+)'/);
      if (!match) return;

      const rawPath = match[1];
      const [pathPart, queryPart] = rawPath.split("?");
      const params = new URLSearchParams(queryPart || "");

      if (!params.get("phone") && phone && phone !== "demo-user") {
        params.set("phone", phone);
      }

      const query = params.toString();
      const updatedPath = query ? `${pathPart}?${query}` : pathPart;
      item.setAttribute("onclick", `window.location.href = '${updatedPath}'`);
    });
  }

  async function loadDynamicSnapshot() {
    const currentPhone = getCurrentPhone();
    const viewedPhone = getViewedProfilePhone(currentPhone);
    const isOwner = viewedPhone === currentPhone;
    bindNavWithPhone(currentPhone);

    document.body.dataset.isProfileOwner = isOwner ? "true" : "false";
    document.dispatchEvent(
      new CustomEvent("sponsee:context", {
        detail: { currentPhone, viewedPhone, isOwner },
      }),
    );

    if (viewedPhone === "demo-user") {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/bootstrap/${encodeURIComponent(viewedPhone)}`,
      );
      if (!res.ok) return;
      const snapshot = await res.json();
      applyUser(snapshot);
      document.dispatchEvent(
        new CustomEvent("sponsee:snapshot", {
          detail: { currentPhone, viewedPhone, isOwner, snapshot },
        }),
      );
    } catch (_err) {
      // Keep static fallback when API is unavailable.
    }
  }

  window.SponseeDynamic = {
    load: loadDynamicSnapshot,
    getCurrentPhone,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDynamicSnapshot);
  } else {
    loadDynamicSnapshot();
  }
})();
