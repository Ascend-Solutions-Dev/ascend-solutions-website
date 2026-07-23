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

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      return copied;
    }
  };

  onReady(() => {
    const styles = document.createElement("style");
    styles.textContent = `
      .mobile-menu-toggle {
        display: none;
        width: 44px;
        height: 44px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(28, 53, 87, 0.16);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.72);
        color: #1c3557;
        font: 700 21px/1 system-ui, sans-serif;
        cursor: pointer;
      }
      .cta-section::before { pointer-events: none !important; }
      .cta-actions {
        position: relative;
        z-index: 2;
      }
      .contact-dialog {
        width: min(560px, calc(100vw - 32px));
        border: 0;
        border-radius: 24px;
        padding: 0;
        color: #1c3557;
        background: #fdf9f5;
        box-shadow: 0 24px 80px rgba(18, 36, 58, 0.28);
      }
      .contact-dialog::backdrop {
        background: rgba(18, 36, 58, 0.62);
        backdrop-filter: blur(4px);
      }
      .contact-dialog-inner { padding: 30px; }
      .contact-dialog-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .contact-dialog h2 {
        margin: 0 0 8px;
        font: 700 28px/1.15 Georgia, serif;
      }
      .contact-dialog p {
        margin: 0;
        color: #6b7280;
        font: 400 14px/1.6 system-ui, sans-serif;
      }
      .contact-dialog-close {
        width: 40px;
        height: 40px;
        flex: 0 0 auto;
        border: 0;
        border-radius: 50%;
        background: #eee9e3;
        color: #1c3557;
        font-size: 24px;
        cursor: pointer;
      }
      .contact-options { display: grid; gap: 10px; }
      .contact-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        padding: 14px 16px;
        border: 1px solid #e8e4df;
        border-radius: 14px;
        background: white;
        color: #1c3557;
        text-align: left;
        cursor: pointer;
      }
      .contact-option:hover { border-color: #e8734a; }
      .contact-option-label {
        display: block;
        margin-bottom: 3px;
        font: 700 14px/1.2 system-ui, sans-serif;
      }
      .contact-option-email {
        display: block;
        color: #6b7280;
        font: 400 12px/1.2 system-ui, sans-serif;
      }
      .contact-option-action {
        color: #e8734a;
        font: 700 12px/1 system-ui, sans-serif;
      }
      .contact-dialog-status {
        min-height: 20px;
        margin-top: 14px !important;
        color: #4a9b7f !important;
      }
      .contact-email-link {
        display: inline-flex;
        margin-top: 6px;
        color: #e8734a;
        font-weight: 700;
      }
      @media (max-width: 900px) {
        .mobile-menu-toggle { display: inline-flex; }
        nav .nav-links.mobile-open {
          display: flex !important;
          position: absolute;
          top: calc(100% + 8px);
          left: 16px;
          right: 16px;
          flex-direction: column;
          align-items: stretch;
          gap: 4px;
          padding: 12px;
          border: 1px solid rgba(28, 53, 87, 0.1);
          border-radius: 18px;
          background: #fdf9f5;
          box-shadow: 0 18px 50px rgba(18, 36, 58, 0.18);
        }
        nav .nav-links.mobile-open a {
          display: block;
          padding: 12px 14px;
          border-radius: 10px;
        }
        nav .nav-links.mobile-open .nav-cta { text-align: center; }
        .cta-actions {
          width: 100%;
          display: grid !important;
          grid-template-columns: 1fr;
        }
        .cta-actions a {
          width: 100%;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .contact-dialog-inner { padding: 24px 20px; }
        .contact-dialog h2 { font-size: 24px; }
        .contact-option { min-height: 64px; }
      }
    `;
    document.head.append(styles);

    const nav = document.getElementById("nav");
    const updateNav = () => nav?.classList.toggle("scrolled", window.scrollY > 20);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });

    if (nav) {
      const navLinks = nav.querySelector(".nav-links");
      if (navLinks) {
        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "mobile-menu-toggle";
        menuButton.setAttribute("aria-label", "Open navigation menu");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "☰";
        nav.append(menuButton);

        const closeMenu = () => {
          navLinks.classList.remove("mobile-open");
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open navigation menu");
          menuButton.textContent = "☰";
        };
        menuButton.addEventListener("click", () => {
          const isOpen = navLinks.classList.toggle("mobile-open");
          menuButton.setAttribute("aria-expanded", String(isOpen));
          menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu",
          );
          menuButton.textContent = isOpen ? "×" : "☰";
        });
        navLinks.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", closeMenu);
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") closeMenu();
        });
        document.addEventListener("click", (event) => {
          if (!nav.contains(event.target)) closeMenu();
        });
      }
    }

    const contactDialog = document.createElement("dialog");
    contactDialog.className = "contact-dialog";
    contactDialog.setAttribute("aria-labelledby", "contact-dialog-title");
    contactDialog.innerHTML = `
      <div class="contact-dialog-inner">
        <div class="contact-dialog-top">
          <div>
            <h2 id="contact-dialog-title">How can we help?</h2>
            <p>Choose the team you need. Tap an address to copy it, then use it in any email app.</p>
          </div>
          <button class="contact-dialog-close" type="button" aria-label="Close contact options">×</button>
        </div>
        <div class="contact-options">
          <button class="contact-option" type="button" data-email="info@ascendsolutions.dev">
            <span><span class="contact-option-label">General questions</span><span class="contact-option-email">info@ascendsolutions.dev</span></span>
            <span class="contact-option-action">Copy</span>
          </button>
          <button class="contact-option" type="button" data-email="sales@ascendsolutions.dev">
            <span><span class="contact-option-label">Early access & partnerships</span><span class="contact-option-email">sales@ascendsolutions.dev</span></span>
            <span class="contact-option-action">Copy</span>
          </button>
          <button class="contact-option" type="button" data-email="support@ascendsolutions.dev">
            <span><span class="contact-option-label">Product support</span><span class="contact-option-email">support@ascendsolutions.dev</span></span>
            <span class="contact-option-action">Copy</span>
          </button>
          <button class="contact-option" type="button" data-email="billing@ascendsolutions.dev">
            <span><span class="contact-option-label">Billing questions</span><span class="contact-option-email">billing@ascendsolutions.dev</span></span>
            <span class="contact-option-action">Copy</span>
          </button>
        </div>
        <p class="contact-dialog-status" role="status" aria-live="polite"></p>
        <a class="contact-email-link" href="mailto:info@ascendsolutions.dev?subject=Website%20inquiry">Or open your email app →</a>
      </div>
    `;
    document.body.append(contactDialog);
    const contactStatus = contactDialog.querySelector(".contact-dialog-status");
    const closeContact = () => contactDialog.close();
    contactDialog
      .querySelector(".contact-dialog-close")
      .addEventListener("click", closeContact);
    contactDialog.addEventListener("click", (event) => {
      if (event.target === contactDialog) closeContact();
    });
    contactDialog.querySelectorAll("[data-email]").forEach((option) => {
      option.addEventListener("click", async () => {
        const emailAddress = option.dataset.email;
        const copied = await copyText(emailAddress);
        contactStatus.textContent = copied
          ? `${emailAddress} copied to your clipboard.`
          : `Email us at ${emailAddress}.`;
      });
    });
    const openContact = (event) => {
      event?.preventDefault();
      contactStatus.textContent = "";
      contactDialog.showModal();
    };

    const homeDestinations = [
      "/apps.html#pantrii",
      "/apps.html#grow-together",
      "/apps.html#waitlist",
    ];
    document.querySelectorAll(".app-teaser").forEach((card, index) => {
      const name = card.querySelector(".app-teaser-name")?.textContent?.trim() || "app";
      const open = () => window.location.assign(homeDestinations[index] || "/apps.html");
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Learn more about ${name}`);
      card.addEventListener("click", open);
      keyboardActivate(card, open);
    });

    const earlyAccess = document.querySelector(".cta-actions .btn-light");
    if (earlyAccess) earlyAccess.href = "/apps.html#waitlist";

    const footerAppDestinations = {
      Pantrii: "/apps.html#pantrii",
      "Family Hub": "/apps.html#pantrii",
      "Grow Together": "/apps.html#grow-together",
      "Coming Soon": "/apps.html#waitlist",
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
        link.addEventListener("click", openContact);
      } else if (label?.startsWith("Share your idea")) {
        link.href = "mailto:info@ascendsolutions.dev?subject=Product%20idea";
      }
    });

    document.querySelectorAll(".footer-links a").forEach((link) => {
      if (link.textContent?.trim() === "Contact") {
        link.addEventListener("click", openContact);
      }
    });
  });
})();
