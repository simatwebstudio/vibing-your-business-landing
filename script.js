const config = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  mobileViewport: window.matchMedia("(max-width: 760px)").matches,
  openingHours: {
    days: [2, 3, 4, 5, 6],
    open: "09:30",
    close: "20:00"
  }
};

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const header = document.querySelector("[data-header]");

  if (!toggle || !menu) return;

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Apri menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    document.body.classList.toggle("nav-open", !isOpen);
    menu.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Apri menu" : "Chiudi menu");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!menu.contains(target) && !toggle.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("scroll", () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }, { passive: true });
}

function getRomeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    day: dayMap[map.weekday],
    minutes: Number(map.hour) * 60 + Number(map.minute)
  };
}

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isOpen(date = new Date()) {
  const now = getRomeParts(date);
  const opens = minutesFromTime(config.openingHours.open);
  const closes = minutesFromTime(config.openingHours.close);
  return config.openingHours.days.includes(now.day) && now.minutes >= opens && now.minutes < closes;
}

function getNextOpeningLabel(date = new Date()) {
  const now = getRomeParts(date);
  const opens = minutesFromTime(config.openingHours.open);
  const dayNames = ["domenica", "lunedi'", "martedi'", "mercoledi'", "giovedi'", "venerdi'", "sabato"];

  if (config.openingHours.days.includes(now.day) && now.minutes < opens) {
    return `${dayNames[now.day]} alle ${config.openingHours.open}`;
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = (now.day + offset) % 7;
    if (config.openingHours.days.includes(nextDay)) {
      return `${dayNames[nextDay]} alle ${config.openingHours.open}`;
    }
  }

  return `mar-sab alle ${config.openingHours.open}`;
}

function renderOpenStatus() {
  const status = document.querySelector("[data-open-status]");
  const title = document.querySelector("[data-open-status-title]");
  const card = document.querySelector("[data-open-card]");
  if (!status) return;

  const open = isOpen();
  const nextOpening = getNextOpeningLabel();
  if (title) {
    title.textContent = open ? "APERTO ORA" : "CHIUSO ORA";
  }
  status.textContent = open ? `Aperto fino alle ${config.openingHours.close}` : `Prossima apertura: ${nextOpening}`;
  const statusTarget = card || status;
  statusTarget.classList.toggle("is-open", open);
  statusTarget.classList.toggle("is-closed", !open);
  statusTarget.setAttribute(
    "aria-label",
    open ? `Aperto ora, fino alle ${config.openingHours.close}` : `Chiuso ora, prossima apertura ${nextOpening}`
  );
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!items.length) return;
  if (config.reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  items.forEach((item) => observer.observe(item));
}

function initParallax() {
  const target = document.querySelector("[data-parallax]");
  if (!target || config.reducedMotion || config.mobileViewport) return;

  let ticking = false;

  const update = () => {
    const isHeroBackground = target.classList.contains("hero-bg");
    const offset = isHeroBackground
      ? Math.min(window.scrollY * 0.16, 90)
      : Math.max(-10, Math.min(10, ((target.getBoundingClientRect().top - window.innerHeight / 2) / window.innerHeight) * -18));
    target.style.setProperty("--parallax-y", `${offset}px`);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });

  update();
}

function initMagneticButtons() {
  if (config.reducedMotion) return;

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.setProperty("--mx", `${x * 0.12}px`);
      button.style.setProperty("--my", `${y * 0.18}px`);
    });

    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--mx", "0px");
      button.style.setProperty("--my", "0px");
    });
  });
}

function initGallery() {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const slides = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
  const prev = gallery.querySelector("[data-gallery-prev]");
  const next = gallery.querySelector("[data-gallery-next]");
  const stage = gallery.querySelector("[data-gallery-stage]");
  let index = 0;
  let startX = 0;

  const render = () => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    if (slides.length <= 1) {
      prev?.setAttribute("disabled", "");
      next?.setAttribute("disabled", "");
    }
  };

  const go = (direction) => {
    if (slides.length <= 1) return;
    index = (index + direction + slides.length) % slides.length;
    render();
  };

  prev?.addEventListener("click", () => go(-1));
  next?.addEventListener("click", () => go(1));

  stage?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  });

  stage?.addEventListener("touchstart", (event) => {
    startX = event.changedTouches[0].clientX;
  }, { passive: true });

  stage?.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) < 48) return;
    go(delta > 0 ? -1 : 1);
  }, { passive: true });

  render();
}

function initCutCarousel() {
  const carousel = document.querySelector("[data-cut-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-cut-track]");
  const dots = carousel.querySelector("[data-cut-dots]");
  const progressFill = carousel.querySelector("[data-cut-progress-fill]");
  const prevButton = carousel.querySelector("[data-cut-prev]");
  const nextButton = carousel.querySelector("[data-cut-next]");
  if (!track || !dots) return;

  const cards = Array.from(track.querySelectorAll(".cut-card"));
  if (!cards.length) return;

  let activeIndex = 0;
  let ticking = false;
  let wheelFrame = 0;
  let wheelDelta = 0;
  let wheelEndTimer = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let dragStartIndex = 0;
  let dragLastX = 0;
  let dragStartTime = 0;
  let dragMoved = false;
  let isTouchPointer = false;

  track.setAttribute("tabindex", "0");
  if (!track.id) {
    track.id = "cut-track";
  }
  prevButton?.setAttribute("aria-controls", track.id);
  nextButton?.setAttribute("aria-controls", track.id);

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const getCardLeft = (card) => track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left;
  const clampScroll = (value) => Math.max(0, Math.min(maxScroll(), value));

  const scrollToCard = (index, behavior = config.reducedMotion ? "auto" : "smooth") => {
    const nextIndex = Math.max(0, Math.min(cards.length - 1, index));
    const targetLeft = clampScroll(getCardLeft(cards[nextIndex]));
    setActive(nextIndex);
    track.scrollTo({ left: targetLeft, behavior });
  };

  const goToSiblingCard = (direction) => {
    scrollToCard(activeIndex + direction);
  };

  cards.forEach((card, index) => {
    card.setAttribute("id", `cut-card-${index + 1}`);
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Vai al taglio ${index + 1}`);
    dot.setAttribute("aria-controls", card.id);
    dot.addEventListener("click", () => scrollToCard(index));
    dots.appendChild(dot);
  });

  const dotButtons = Array.from(dots.querySelectorAll("button"));

  const setActive = (index) => {
    if (index === activeIndex && dotButtons[index]?.classList.contains("is-active")) return;
    activeIndex = index;
    dotButtons.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  const update = () => {
    const scrollLimit = maxScroll();
    carousel.classList.toggle("is-not-scrollable", scrollLimit <= 1);

    if (progressFill) {
      const progress = scrollLimit <= 1 ? 1 : track.scrollLeft / scrollLimit;
      progressFill.style.transform = `scaleX(${0.1 + progress * 0.9})`;
    }

    const trackLeft = track.getBoundingClientRect().left;
    const nextIndex = cards.reduce((closest, card, index) => {
      const cardLeft = track.scrollLeft + card.getBoundingClientRect().left - trackLeft;
      const targetLeft = Math.min(cardLeft, scrollLimit);
      const distance = Math.abs(targetLeft - track.scrollLeft);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: 0, distance: Infinity }).index;

    setActive(nextIndex);
    prevButton?.toggleAttribute("disabled", track.scrollLeft <= 2 || scrollLimit <= 1);
    nextButton?.toggleAttribute("disabled", track.scrollLeft >= scrollLimit - 2 || scrollLimit <= 1);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  track.addEventListener("scroll", () => {
    requestUpdate();
  }, { passive: true });

  track.addEventListener("wheel", (event) => {
    if (maxScroll() <= 1) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;

    const nextScrollLeft = clampScroll(track.scrollLeft + delta);
    if (Math.round(nextScrollLeft) === Math.round(track.scrollLeft)) return;

    wheelDelta += delta;
    track.classList.add("is-wheel-scrolling");
    event.preventDefault();

    if (!wheelFrame) {
      wheelFrame = window.requestAnimationFrame(() => {
        track.scrollLeft = clampScroll(track.scrollLeft + wheelDelta);
        wheelDelta = 0;
        wheelFrame = 0;
        requestUpdate();
      });
    }

    window.clearTimeout(wheelEndTimer);
    wheelEndTimer = window.setTimeout(() => {
      track.classList.remove("is-wheel-scrolling");
      requestUpdate();
    }, 140);
  }, { passive: false });

  track.addEventListener("pointerdown", (event) => {
    isTouchPointer = event.pointerType === "touch";
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (maxScroll() <= 1) return;

    isDragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragLastX = event.clientX;
    dragStartScrollLeft = track.scrollLeft;
    dragStartIndex = activeIndex;
    dragStartTime = performance.now();
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) > 3) {
      dragMoved = true;
      event.preventDefault();
    }
    dragLastX = event.clientX;
    track.scrollLeft = dragStartScrollLeft - delta;
  });

  const stopDragging = (event) => {
    if (!isDragging) return;

    isDragging = false;
    track.classList.remove("is-dragging");
    if (event?.pointerId && track.hasPointerCapture?.(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    const endX = typeof event?.clientX === "number" ? event.clientX : dragLastX;
    const delta = endX - dragStartX;
    const elapsed = Math.max(1, performance.now() - dragStartTime);
    const velocity = Math.abs(delta) / elapsed;
    const cardWidth = cards[activeIndex]?.getBoundingClientRect().width || track.clientWidth;
    const swipeThreshold = Math.min(90, Math.max(36, cardWidth * 0.18));

    if (dragMoved && event?.type === "pointerup") {
      if (Math.abs(delta) >= swipeThreshold || velocity > 0.45) {
        scrollToCard(dragStartIndex + (delta < 0 ? 1 : -1));
      } else {
        scrollToCard(dragStartIndex);
      }
      return;
    }

    requestUpdate();
  };

  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);
  track.addEventListener("pointerleave", stopDragging);

  track.addEventListener("click", (event) => {
    if (!dragMoved || isTouchPointer) return;
    event.preventDefault();
    event.stopPropagation();
    dragMoved = false;
  }, true);

  track.addEventListener("keydown", (event) => {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;

    event.preventDefault();
    goToSiblingCard(direction);
  });

  prevButton?.addEventListener("click", () => goToSiblingCard(-1));
  nextButton?.addEventListener("click", () => goToSiblingCard(1));

  window.addEventListener("resize", requestUpdate);
  update();
}

function loadCutCardImages() {
  const cards = document.querySelectorAll("[data-cut-image]");
  const extensions = ["jpg", "jpeg", "png", "webp", "avif"];

  cards.forEach((card, index) => {
    const basePath = card.getAttribute("data-cut-image");
    if (!basePath) return;

    card.classList.add("is-empty");
    const candidates = [basePath, ...extensions.map((extension) => `${basePath}.${extension}`)];

    const tryCandidate = (candidateIndex = 0) => {
      if (candidateIndex >= candidates.length) {
        card.classList.add("is-empty");
        return;
      }

      const image = document.createElement("img");
      image.decoding = "async";
      image.draggable = false;
      image.alt = `Taglio ${index + 1} Victory Lap`;
      image.onload = () => {
        image.loading = "lazy";
        card.prepend(image);
        card.classList.remove("is-empty");
        card.classList.add("has-image");
      };
      image.onerror = () => tryCandidate(candidateIndex + 1);
      image.src = candidates[candidateIndex];
    };

    tryCandidate();
  });
}

function initAutoplayVideos() {
  const videos = Array.from(document.querySelectorAll("[data-autoplay-video]"));
  if (!videos.length) return;
  let unlockAttempted = false;

  const play = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("autoplay", "");
    if (video.readyState === 0) {
      video.load();
    }
    return video.play().catch(() => {});
  };

  const retryVisibleVideos = () => {
    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (isVisible) play(video);
    });
  };

  const unlockVideos = () => {
    if (unlockAttempted) return;
    unlockAttempted = true;
    videos.forEach(play);
  };

  videos.forEach((video) => {
    video.addEventListener("loadeddata", () => play(video), { once: true });
    video.addEventListener("canplay", () => play(video), { once: true });
  });

  if (!("IntersectionObserver" in window)) {
    videos.forEach(play);
    window.addEventListener("pointerdown", unlockVideos, { once: true, passive: true });
    window.addEventListener("touchstart", retryVisibleVideos, { once: true, passive: true });
    window.addEventListener("scroll", retryVisibleVideos, { once: true, passive: true });
    return;
  }

  const visibleVideos = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (!(video instanceof HTMLVideoElement)) return;

      if (entry.isIntersecting) {
        visibleVideos.add(video);
        play(video);
      } else {
        visibleVideos.delete(video);
        video.pause();
      }
    });
  }, {
    rootMargin: "180px 0px",
    threshold: 0.24
  });

  videos.forEach((video) => observer.observe(video));
  videos.forEach(play);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      visibleVideos.forEach((video) => video.pause());
      return;
    }

    visibleVideos.forEach(play);
  });

  window.addEventListener("pageshow", retryVisibleVideos);
  window.addEventListener("focus", retryVisibleVideos);
  window.addEventListener("pointerdown", unlockVideos, { once: true, passive: true });
  window.addEventListener("touchstart", retryVisibleVideos, { once: true, passive: true });
  window.addEventListener("touchend", retryVisibleVideos, { once: true, passive: true });
  window.addEventListener("scroll", retryVisibleVideos, { once: true, passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("js-enabled");
  initNavigation();
  initReveal();
  initParallax();
  initMagneticButtons();
  initGallery();
  loadCutCardImages();
  initCutCarousel();
  initAutoplayVideos();
  renderOpenStatus();
  window.setInterval(renderOpenStatus, 60000);
});
