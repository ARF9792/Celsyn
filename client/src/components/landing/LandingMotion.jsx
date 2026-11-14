import { useLayoutEffect } from "react";

export default function LandingMotion() {
  useLayoutEffect(() => {
    const page = document.querySelector(".landing-page");
    const elements = [...document.querySelectorAll("[data-scroll-reveal]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    page?.classList.add("is-motion-ready");

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-in-view"));
      return () => page?.classList.remove("is-motion-ready");
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -14%", threshold: 0.22 });

    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      page?.classList.remove("is-motion-ready");
    };
  }, []);

  return null;
}
