
"use strict";

/* =========================================================
   ELEMENTOS PRINCIPALES
========================================================= */

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const header = document.querySelector(".header");

const sliderPrev = document.getElementById("sliderPrev");
const sliderNext = document.getElementById("sliderNext");
const destacadosTrack = document.getElementById("destacadosTrack");

/* =========================================================
   MENÚ MÓVIL
========================================================= */

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    menuBtn.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });
}

/* Cerrar el menú al presionar un enlace */

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav?.classList.remove("open");

    menuBtn?.setAttribute(
      "aria-expanded",
      "false"
    );
  });
});

/* Cerrar el menú al hacer clic fuera */

document.addEventListener("click", event => {
  if (!menuBtn || !nav) {
    return;
  }

  const clickedMenuButton = menuBtn.contains(event.target);
  const clickedNavigation = nav.contains(event.target);

  if (
    !clickedMenuButton &&
    !clickedNavigation &&
    nav.classList.contains("open")
  ) {
    nav.classList.remove("open");

    menuBtn.setAttribute(
      "aria-expanded",
      "false"
    );
  }
});

/* =========================================================
   HEADER AL HACER SCROLL
========================================================= */

function updateHeader() {
  if (!header) {
    return;
  }

  if (window.scrollY > 70) {
    header.classList.add("header-scrolled");
  } else {
    header.classList.remove("header-scrolled");
  }
}

window.addEventListener("scroll", updateHeader);

updateHeader();

/* =========================================================
   DESPLAZAMIENTO SUAVE
========================================================= */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", event => {
    const targetId = anchor.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const target = document.querySelector(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();

    const headerHeight = header
      ? header.offsetHeight
      : 0;

    const targetPosition =
      target.getBoundingClientRect().top +
      window.scrollY -
      headerHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth"
    });
  });
});

/* =========================================================
   CARRUSEL DE PLATOS DESTACADOS
========================================================= */

function moveFeaturedSlider(direction) {
  if (!destacadosTrack) {
    return;
  }

  const firstCard =
    destacadosTrack.querySelector(".dish-card");

  if (!firstCard) {
    return;
  }

  const cardWidth = firstCard.offsetWidth;
  const gap = 14;
  const movement = cardWidth + gap;

  destacadosTrack.scrollBy({
    left: direction * movement,
    behavior: "smooth"
  });
}

sliderPrev?.addEventListener("click", () => {
  moveFeaturedSlider(-1);
});

sliderNext?.addEventListener("click", () => {
  moveFeaturedSlider(1);
});

/* =========================================================
   ANIMACIONES AL APARECER
========================================================= */

const animatedItems = document.querySelectorAll(
  [
    ".benefit-item",
    ".promo-card",
    ".dish-card",
    ".experiencia-content",
    ".instagram-box",
    ".instagram-gallery a"
  ].join(",")
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  animatedItems.forEach(item => {
    item.classList.add("hidden");
    observer.observe(item);
  });
} else {
  animatedItems.forEach(item => {
    item.classList.add("show");
  });
}

/* =========================================================
   CERRAR MENÚ AL CAMBIAR A ESCRITORIO
========================================================= */

window.addEventListener("resize", () => {
  if (window.innerWidth > 860) {
    nav?.classList.remove("open");

    menuBtn?.setAttribute(
      "aria-expanded",
      "false"
    );
  }
});
