(() => {
  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  const keyboardActivate = (element, action) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    });
  };

  onReady(() => {
    const nav = document.getElementById("nav");
    const updateNav = () => nav?.classList.toggle("scrolled", window.scrollY > 20);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });

    const homeDestinations = [
      "/apps#pantrii",
      "/apps#grow-together",
      "/apps#waitlist",
    ];
    document.querySelectorAll(".app-teaser").forEach((card, index) => {
      const name = card.querySelector(".app-teaser-name")?.textContent?.trim() || "app";
      const open = () => window.location.assign(homeDestinations[index] || "/apps");
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Learn more about ${name}`);
      card.addEventListener("click", open);
      keyboardActivate(card, open);
    });

    const earlyAccess = document.querySelector(".cta-actions .btn-light");
    if (earlyAccess) earlyAccess.href = "/apps#waitlist";

    const footerAppDestinations = {
      Pantrii: "/apps#pantrii",
      "Grow Together": "/apps#grow-together",
      "Coming Soon": "/apps#waitlist",
    };
    document.querySelectorAll(".footer-links a").forEach((link) => {
      const destination = footerAppDestinations[link.textContent?.trim()];
      if (destination) link.href = destination;
    });

    const waitlist = document.getElementById("waitlist");
    const email = waitlist?.querySelector(".waitlist-input");
    const button = waitlist?.querySelector(".btn-white");
    const eyebrow = waitlist?.querySelector(".waitlist-eyebrow");
    const headline = waitlist?.querySelector(".waitlist-headline");
    let selectedApp = "Pantrii";

    if (waitlist && email && button) {
      email.id = "waitlist-email";
      email.name = "email";
      email.required = true;
      email.autocomplete = "email";
      email.setAttribute("aria-label", "Email address");
      button.type = "button";
      button.removeAttribute("onclick");

      const status = document.createElement("p");
      status.className = "waitlist-status";
      status.id = "waitlist-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      button.setAttribute("aria-describedby", status.id);
      waitlist.querySelector(".waitlist-form")?.append(status);

      const submit = () => {
        if (!email.checkValidity()) {
          status.textContent = "Please enter a valid email address.";
          status.dataset.state = "error";
          email.reportValidity();
          return;
        }
        const subject = encodeURIComponent(`${selectedApp} early access`);
        const body = encodeURIComponent(
          `Please add me to the ${selectedApp} early-access list.\n\nEmail: ${email.value.trim()}`,
        );
        status.textContent = "Your email draft is ready—send it to finish joining.";
        status.dataset.state = "success";
        window.location.href =
          `mailto:sales@ascendsolutions.dev?subject=${subject}&body=${body}`;
      };

      button.addEventListener("click", submit);
      email.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submit();
      });

      const appNames = [
        "Grow Together",
        "Family Memories",
        "Family Budget",
        "Learn Together",
        "Family Wellness",
      ];
      document.querySelectorAll(".apps-grid-section .app-card").forEach((card, index) => {
        if (index >= appNames.length) return;
        const appName =
          card.querySelector(".app-card-name")?.textContent?.trim() || appNames[index];
        const select = () => {
          selectedApp = appName;
          if (eyebrow) eyebrow.textContent = `Product updates · ${appName}`;
          if (headline) headline.innerHTML = `Get updates about<br/>${appName}`;
          button.textContent = "Keep Me Updated";
          status.textContent = `${appName} selected. Enter your email to continue.`;
          status.dataset.state = "selected";
          waitlist.scrollIntoView({ behavior: "smooth", block: "center" });
          window.setTimeout(() => email.focus({ preventScroll: true }), 450);
        };
        card.id = appName.toLowerCase().replaceAll(" ", "-");
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `Get updates about ${appName}`);
        card.addEventListener("click", select);
        keyboardActivate(card, select);
      });
    }

    const pantrii = document.querySelector(".featured-card");
    if (pantrii) pantrii.id = "pantrii";

    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        document
          .querySelectorAll(".sidebar-nav a")
          .forEach((item) => item.classList.remove("active"));
        link.classList.add("active");
      });
    });

    document.querySelectorAll(".footer-links").forEach((list) => {
      const links = Array.from(list.querySelectorAll("a"));
      const contactLink = links.find((link) => link.textContent?.trim() === "Contact");
      if (!contactLink) return;

      contactLink.href = "mailto:info@ascendsolutions.dev?subject=Website%20inquiry";
      const footerContacts = [
        ["Support", "mailto:support@ascendsolutions.dev?subject=Support%20request"],
        ["Billing", "mailto:billing@ascendsolutions.dev?subject=Billing%20question"],
      ];
      footerContacts.forEach(([label, href]) => {
        if (links.some((link) => link.textContent?.trim() === label)) return;
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = label;
        link.href = href;
        item.append(link);
        list.append(item);
      });
    });

    document.querySelectorAll("a[href^='mailto:']").forEach((link) => {
      const label = link.textContent?.trim();
      if (label === "Get in Touch" || label === "Contact Us") {
        link.href = "mailto:info@ascendsolutions.dev?subject=Website%20inquiry";
      } else if (label?.startsWith("Share your idea")) {
        link.href = "mailto:info@ascendsolutions.dev?subject=Product%20idea";
      }
    });
  });
})();
