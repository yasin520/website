(function () {
  var DEFAULT_CONFIG = {
    apiBaseUrl: "",
    endpoints: {
      notify: ""
    },
    storeLinks: {
      blackhole: { ios: "", android: "" },
      hydronudge: { ios: "", android: "" }
    }
  };

  function mergeConfig(base, custom) {
    var merged = {};
    var key;

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        if (typeof base[key] === "object" && base[key] !== null && !Array.isArray(base[key])) {
          merged[key] = mergeConfig(base[key], {});
        } else {
          merged[key] = base[key];
        }
      }
    }

    if (!custom || typeof custom !== "object") {
      return merged;
    }

    for (key in custom) {
      if (Object.prototype.hasOwnProperty.call(custom, key)) {
        if (typeof custom[key] === "object" && custom[key] !== null && !Array.isArray(custom[key])) {
          merged[key] = mergeConfig(merged[key] || {}, custom[key]);
        } else {
          merged[key] = custom[key];
        }
      }
    }

    return merged;
  }

  var SITE_CONFIG = mergeConfig(DEFAULT_CONFIG, window.KIDO_CONFIG || {});
  window.KIDO_CONFIG = SITE_CONFIG;

  function storageGet(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  }

  function setTheme(theme) {
    var safeTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", safeTheme);
    document.querySelectorAll(".theme-btn").forEach(function (button) {
      button.classList.remove("active");
    });
    var selectedButton = document.querySelector('.theme-btn[data-theme="' + safeTheme + '"]');
    if (selectedButton) {
      selectedButton.classList.add("active");
    }
    storageSet("theme", safeTheme);
  }

  function setLang(lang) {
    var safeLang = lang === "tr" ? "tr" : "en";
    document.documentElement.setAttribute("lang", safeLang);

    document.querySelectorAll(".lang-btn").forEach(function (button) {
      button.classList.remove("active");
    });

    var selectedButton = document.querySelector('.lang-btn[data-lang="' + safeLang + '"]');
    if (selectedButton) {
      selectedButton.classList.add("active");
    }

    document.querySelectorAll("[data-en]").forEach(function (element) {
      var translatedText = element.getAttribute("data-" + safeLang);
      if (translatedText) {
        element.textContent = translatedText;
      }
    });

    document.querySelectorAll("[data-placeholder-en]").forEach(function (element) {
      var translatedPlaceholder = element.getAttribute("data-placeholder-" + safeLang);
      if (translatedPlaceholder) {
        element.setAttribute("placeholder", translatedPlaceholder);
      }
    });

    storageSet("lang", safeLang);
  }

  function normalizeBaseUrl(url) {
    if (!url) {
      return "";
    }
    return String(url).replace(/\/+$/, "");
  }

  function buildApiUrl(endpointPath) {
    if (!endpointPath) {
      return "";
    }
    if (/^https?:\/\//i.test(endpointPath)) {
      return endpointPath;
    }
    var baseUrl = normalizeBaseUrl(SITE_CONFIG.apiBaseUrl);
    if (!baseUrl) {
      return "";
    }
    var normalizedPath = String(endpointPath).startsWith("/") ? endpointPath : "/" + endpointPath;
    return baseUrl + normalizedPath;
  }

  function getStoreUrl(appName, platformName) {
    var stores = SITE_CONFIG.storeLinks && SITE_CONFIG.storeLinks[appName];
    if (!stores) {
      return "";
    }
    return stores[platformName] || "";
  }

  function applyStoreLinks() {
    document.querySelectorAll("a[data-store-app][data-store-platform]").forEach(function (anchor) {
      var appName = anchor.getAttribute("data-store-app");
      var platformName = anchor.getAttribute("data-store-platform");
      var url = getStoreUrl(appName, platformName);
      if (!url) {
        anchor.removeAttribute("href");
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
        anchor.classList.add("is-disabled");
        anchor.setAttribute("aria-disabled", "true");
        return;
      }
      anchor.setAttribute("href", url);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      anchor.classList.remove("is-disabled");
      anchor.removeAttribute("aria-disabled");
    });
  }

  function showNotifyMessage(kind, text) {
    var message = document.getElementById("notifyMessage");
    if (!message) {
      return;
    }
    message.className = "notify-message " + kind;
    message.textContent = text;
  }

  function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleNotify() {
    var emailInput = document.getElementById("notifyEmail");
    if (!emailInput) {
      return;
    }

    var notifyButton = document.querySelector(".notify-btn");
    var email = emailInput.value.trim();
    var activeLang = storageGet("lang", "en");
    var notifyEndpoint = buildApiUrl(SITE_CONFIG.endpoints && SITE_CONFIG.endpoints.notify);

    if (!isEmailValid(email)) {
      showNotifyMessage(
        "error",
        activeLang === "tr" ? "Lütfen geçerli bir e-posta gir." : "Please enter a valid email address."
      );
      return;
    }

    if (!notifyEndpoint) {
      showNotifyMessage(
        "success",
        activeLang === "tr"
          ? "E-posta kaydedildi. API bağlandıktan sonra otomatik gönderim aktif olacak."
          : "Email captured. Automatic backend sending will work after API setup."
      );
      emailInput.value = "";
      return;
    }

    if (notifyButton) {
      notifyButton.disabled = true;
    }
    showNotifyMessage("info", activeLang === "tr" ? "Gönderiliyor..." : "Submitting...");

    try {
      var response = await fetch(notifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          source: "website",
          app: "hydronudge"
        })
      });

      if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
      }

      emailInput.value = "";
      showNotifyMessage(
        "success",
        activeLang === "tr" ? "Kaydın alındı. Yayında haber vereceğiz." : "You're in. We'll notify you at launch."
      );
    } catch (error) {
      showNotifyMessage(
        "error",
        activeLang === "tr"
          ? "Şu an gönderilemedi. Birkaç dakika sonra tekrar dene."
          : "Unable to submit right now. Please try again in a few minutes."
      );
    } finally {
      if (notifyButton) {
        notifyButton.disabled = false;
      }
    }
  }

  function initAnimations() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".fade-in").forEach(function (element) {
        element.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (entry.isIntersecting) {
            setTimeout(function () {
              entry.target.classList.add("visible");
            }, index * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in").forEach(function (element) {
      observer.observe(element);
    });
  }

  window.setTheme = setTheme;
  window.setLang = setLang;
  window.handleNotify = handleNotify;

  document.addEventListener("DOMContentLoaded", function () {
    setTheme(storageGet("theme", "dark"));
    setLang(storageGet("lang", "en"));
    applyStoreLinks();
    initAnimations();
  });
})();
