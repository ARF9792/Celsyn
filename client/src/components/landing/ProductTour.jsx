import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Activity, ClipboardCheck, LayoutDashboard, TriangleAlert, Truck } from "lucide-react";
import BrandLogo from "../BrandLogo.jsx";

export const productViews = [
  { id: "overview", label: "Overview", image: "/landing/overview.png", alt: "Celsyn fleet safety overview", icon: LayoutDashboard, width: 1440, height: 978, navigationTop: 144 },
  { id: "fleet", label: "Live fleet", image: "/landing/fleet.png", alt: "Celsyn live fleet map and vehicle directory", icon: Truck, width: 1440, height: 2141, navigationTop: 144 },
  { id: "incidents", label: "Incidents", image: "/landing/incidents.png", alt: "Celsyn incident center", icon: TriangleAlert, width: 1440, height: 1119, navigationTop: 58 },
  { id: "compliance", label: "Compliance", image: "/landing/compliance.png", alt: "Celsyn cold-chain compliance analytics", icon: ClipboardCheck, width: 1440, height: 1150, navigationTop: 144 },
  { id: "system", label: "System health", image: "/landing/system.png", alt: "Celsyn telemetry pipeline health", icon: Activity, width: 1440, height: 1340, navigationTop: 144 },
];

const previewNavigation = ["overview", "fleet", "incidents", "compliance", "system"];

export function ProductScreenshot({ view, className = "", position = "top" }) {
  return (
    <div className={`landing-screen ${className}`}>
      <div className="landing-screen-bar">
        <span><BrandLogo className="screen-logo" /> Celsyn</span>
        <span className="landing-screen-live"><i /> Live telemetry</span>
      </div>
      <img src={view.image} alt={view.alt} style={{ objectPosition: position }} loading="lazy" />
    </div>
  );
}

export default function ProductTour() {
  const [activeId, setActiveId] = useState("fleet");
  const [hotspots, setHotspots] = useState([]);
  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const scrollPositionRef = useRef(null);
  const activeView = productViews.find((view) => view.id === activeId) || productViews[0];

  useLayoutEffect(() => {
    const position = scrollPositionRef.current;
    if (!position) return undefined;

    window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
      scrollPositionRef.current = null;
    });

    return () => cancelAnimationFrame(frame);
  }, [activeId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image) return undefined;

    const calculateHotspots = () => {
      const rect = viewport.getBoundingClientRect();
      const sourceWidth = image.naturalWidth || activeView.width;
      const sourceHeight = image.naturalHeight || activeView.height;
      const scale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight);
      const renderedWidth = sourceWidth * scale;
      const alignLeft = window.matchMedia("(max-width: 650px)").matches;
      const offsetX = alignLeft ? 0 : (rect.width - renderedWidth) / 2;

      setHotspots(previewNavigation.map((id, index) => ({
        id,
        style: {
          left: `${offsetX + 16 * scale}px`,
          top: `${(activeView.navigationTop + index * 52) * scale}px`,
          width: `${215 * scale}px`,
          height: `${48 * scale}px`,
        },
      })));
    };

    const observer = new ResizeObserver(calculateHotspots);
    observer.observe(viewport);
    image.addEventListener("load", calculateHotspots);
    calculateHotspots();

    return () => {
      observer.disconnect();
      image.removeEventListener("load", calculateHotspots);
    };
  }, [activeView]);

  const selectPreview = (id, event) => {
    event.currentTarget.blur();
    if (id === activeId) return;
    scrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
    setActiveId(id);
  };

  return (
    <div className="landing-product-window" data-enter-media>
      <div className="landing-tour-viewport" ref={viewportRef} aria-live="polite">
        <img ref={imageRef} key={activeView.id} src={activeView.image} alt={activeView.alt} />
        <div className="landing-tour-hotspots" aria-label="Explore Celsyn product screens">
          {hotspots.map((item) => {
            const view = productViews.find((candidate) => candidate.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${view.label} preview`}
                aria-pressed={item.id === activeId}
                className={item.id === activeId ? "is-current" : ""}
                style={item.style}
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => selectPreview(item.id, event)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
