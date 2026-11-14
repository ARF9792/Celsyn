import { Activity, ArrowRight, ClipboardCheck, MapPinned, Thermometer, TriangleAlert, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo.jsx";
import LandingMotion from "../components/landing/LandingMotion.jsx";
import ParticleWave from "../components/landing/ParticleWave.jsx";
import ProductTour, { ProductScreenshot, productViews } from "../components/landing/ProductTour.jsx";
import "../styles/landing.css";

const chapters = [
  {
    id: "fleet",
    title: <>Live fleet<br />position</>,
    text: "See the refrigerated fleet on the map, filter by operating state, and keep the selected vehicle synchronized with its telemetry.",
    link: "/app/fleet",
    view: productViews[1],
    features: [
      ["Live vehicle geography", "Truck markers use the latitude, longitude, and safety state reported by the telemetry pipeline."],
      ["Synchronized selection", "Selecting a marker or table row updates the same vehicle detail panel."],
      ["Operational filtering", "Search and safety-state filters remain active while live telemetry continues to arrive."],
      ["Temperature history", "Stored and incoming values share one temperature chart with the cargo-safe range visible."],
    ],
  },
  {
    id: "vehicle",
    title: <>Vehicle telemetry<br />record</>,
    text: "Open one truck record for its temperature, humidity, speed, fuel, door, reefer, position, compliance, and recent incidents.",
    link: "/app/fleet/TRK-001",
    view: { id: "truck", image: "/landing/truck.png", alt: "Celsyn refrigerated truck record" },
    imageClass: "is-portrait",
    features: [
      ["Cargo-safe context", "The current temperature stays beside the safe range assigned to the truck’s cargo."],
      ["Historical and live data", "Stored telemetry and new Socket.IO readings continue in one chronological view."],
      ["Current operating state", "Fuel, cargo door, reefer, speed, humidity, and position remain visible together."],
      ["Connected incident history", "The truck record links the vehicle’s recent detection events to the same operating context."],
    ],
  },
  {
    id: "incidents",
    title: <>Incident<br />triage</>,
    text: "Review temperature, reefer, moving-door, and low-fuel detections in a searchable queue with the affected vehicle beside each event.",
    link: "/app/incidents",
    view: productViews[2],
    features: [
      ["Newest events first", "The incident queue keeps the latest warning and critical detections at the top."],
      ["Focused event detail", "Selecting an incident reveals its type, time, truck, source event, and available telemetry."],
      ["Fleet navigation", "Open the associated truck record or locate the vehicle in Live Fleet."],
      ["Real detection behavior", "The view preserves the backend’s existing incident rules and cooldown behavior."],
    ],
  },
  {
    id: "compliance",
    title: <>Temperature<br />compliance</>,
    text: "Inspect stored telemetry for time in range, excursion duration, temperature extremes, sample gaps, and the newest excursions.",
    link: "/app/compliance",
    view: productViews[3],
    features: [
      ["Selectable analysis window", "Review a refrigerated truck across the available 60-minute, 6-hour, or 24-hour window."],
      ["Observed time in range", "Compliance is calculated from stored samples against the cargo’s configured temperature limits."],
      ["Excursion timeline", "Out-of-range periods retain their duration, direction, sample count, and maximum deviation."],
      ["Data continuity", "The view exposes the analyzed interval and the maximum observed sample gap."],
    ],
  },
  {
    id: "system",
    title: <>Telemetry pipeline<br />health</>,
    text: "Follow accepted events through validation, MongoDB persistence, and Socket.IO delivery with live throughput and latency.",
    link: "/app/system",
    view: productViews[4],
    features: [
      ["Ingestion counters", "Received, accepted, rejected, and dropped events stay visible from the running processor."],
      ["Persistence state", "The current queue and persisted-event count show the storage path directly."],
      ["Client delivery", "Broadcast calls, connected clients, coalesced events, and latency describe live delivery."],
      ["Rolling system view", "The browser keeps a current one-minute chart of throughput and latency."],
    ],
  },
];

const statementLead = "One operating view for refrigerated fleet safety.";
const statementRest = "See which vehicles need attention, then move directly into position, telemetry, incidents, and compliance.";

function AnimatedStatement() {
  const leadWords = statementLead.split(" ");
  const words = [...leadWords, ...statementRest.split(" ")];

  return (
    <h2 className="landing-statement landing-scroll-words" data-scroll-reveal="words">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`landing-word ${index < leadWords.length ? "is-emphasis" : ""}`}
          style={{ "--word-index": index }}
        >
          {word}{index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

function FeatureChapter({ chapter }) {
  return (
    <section id={chapter.id} className="landing-section landing-capability" style={{ "--h": 1 }}>
      <div className="wrap landing-wrap">
        <div className="landing-section-head">
          <h2>{chapter.title}</h2>
          <div>
            <p>{chapter.text}</p>
            <Link className="landing-text-link" to={chapter.link}>Open this screen <ArrowRight size={16} /></Link>
          </div>
        </div>
        <ProductScreenshot view={chapter.view} className={chapter.imageClass || ""} />
        <div className="landing-feature-list">
          <span>Features</span>
          <div>
            {chapter.features.map(([title, text]) => (
              <details key={title}>
                <summary>{title}<span>+</span></summary>
                <p>{text}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage({ authenticated = false }) {
  const dashboardTarget = authenticated ? "/app/overview" : "/login";

  return (
    <div className="landing-page">
      <ParticleWave />
      <LandingMotion />
      <header className="landing-nav">
        <div className="wrap landing-wrap landing-nav-inner">
          <a className="landing-skip" href="#landing-main">Skip to content</a>
          <a className="landing-brand" href="#landing-hero" aria-label="Celsyn home">
            <BrandLogo className="landing-logo" />
            <strong>Celsyn</strong>
          </a>
          <nav aria-label="Landing navigation">
            <a href="#why-celsyn">Why Celsyn</a>
            <a href="#fleet">Product</a>
            <Link className="landing-nav-button" to={dashboardTarget}>Open dashboard</Link>
          </nav>
        </div>
      </header>

      <main id="landing-main">
        <section id="landing-hero" className="landing-hero" data-enter>
          <div className="wrap landing-wrap">
            <h1>Cold-chain fleet operations,<br />from telemetry to action.</h1>
            <div className="landing-hero-sub">
              <p>Monitor refrigerated fleets across live temperature, position, incidents, compliance, and telemetry pipeline health.</p>
              <a className="landing-text-link" href="#fleet"><strong>See live fleet</strong><ArrowRight size={17} /></a>
            </div>
            <ProductTour />
          </div>
        </section>

        <section className="landing-workflow" aria-labelledby="workflow-title">
          <div className="wrap landing-wrap">
            <p id="workflow-title" className="landing-workflow-title">Follow the cold-chain workflow</p>
            <div>
              <span><MapPinned />Live position</span>
              <span><Thermometer />Temperature</span>
              <span><Truck />Vehicle records</span>
              <span><TriangleAlert />Incidents</span>
              <span><ClipboardCheck />Compliance</span>
              <span><Activity />Pipeline health</span>
            </div>
          </div>
        </section>

        <section id="product" className="landing-section landing-overview" style={{ "--h": 1 }}>
          <div className="wrap landing-wrap">
            <AnimatedStatement />
            <div className="landing-principles">
              <article>
                <ProductScreenshot view={productViews[0]} />
                <h3>Fleet state first</h3>
                <p>Healthy, warning, critical, and reporting counts establish the current operating posture.</p>
              </article>
              <article>
                <ProductScreenshot view={productViews[1]} />
                <h3>Vehicle operating context</h3>
                <p>Map position, live telemetry, cargo limits, and history stay connected to one selected truck.</p>
              </article>
              <article>
                <ProductScreenshot view={productViews[2]} />
                <h3>Incident detection review</h3>
                <p>Each incoming incident leads back to the affected vehicle and its operating data.</p>
              </article>
            </div>
          </div>
        </section>

        {chapters.map((chapter) => <FeatureChapter key={chapter.id} chapter={chapter} />)}

        <section id="tour" className="landing-section landing-tour-section" style={{ "--h": 1 }}>
          <div className="wrap landing-wrap">
            <div className="landing-minor-head">
              <h2>Explore the operating views</h2>
              <Link className="landing-text-link" to={dashboardTarget}>Open dashboard <ArrowRight size={16} /></Link>
            </div>
            <div className="landing-card-grid">
              {[
                [productViews[1], "Fleet geography", "Select a refrigerated vehicle from the map or the directory."],
                [productViews[2], "Incident review", "Filter detections and open the affected truck in context."],
                [productViews[4], "Pipeline health", "Inspect live ingestion, persistence, broadcast, and latency."],
              ].map(([view, title, text]) => (
                <Link key={view.id} className="landing-product-card" to={view.id === "fleet" ? "/app/fleet" : view.id === "incidents" ? "/app/incidents" : "/app/system"}>
                  <ProductScreenshot view={view} />
                  <h3>{title}<ArrowRight size={15} /></h3>
                  <p>{text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="why-celsyn" className="landing-section landing-why" style={{ "--h": 1 }}>
          <div className="wrap landing-wrap">
            <div className="landing-why-head">
              <span>Why Celsyn</span>
              <h2 data-scroll-reveal="headline">Cold-chain decisions need current operating context.</h2>
              <p>Celsyn keeps fleet position, vehicle telemetry, detection events, compliance, and system delivery connected inside one application.</p>
            </div>
            <div className="landing-why-grid">
              <article>
                <span>01</span>
                <ProductScreenshot view={productViews[0]} />
                <h3>Know fleet state</h3>
                <p>Start with the vehicles that require attention and the latest incoming incidents.</p>
              </article>
              <article>
                <span>02</span>
                <ProductScreenshot view={productViews[2]} />
                <h3>Trace the event</h3>
                <p>Move from a detection into the truck record, live location, and surrounding telemetry.</p>
              </article>
              <article>
                <span>03</span>
                <ProductScreenshot view={productViews[4]} />
                <h3>Verify telemetry delivery</h3>
                <p>See whether telemetry is being accepted, stored, and delivered to connected operators.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer id="landing-footer" className="landing-footer">
        <div className="wrap landing-wrap">
          <div className="landing-close">
            <h2>Open the Celsyn operations dashboard.</h2>
            <Link className="landing-main-button" to={dashboardTarget}>Open dashboard <ArrowRight size={17} /></Link>
          </div>
          <div className="landing-footer-directory">
            <a className="landing-brand" href="#landing-hero"><BrandLogo className="landing-logo" /><strong>Celsyn</strong></a>
            <div><h3>Product</h3><a href="#fleet">Live fleet</a><a href="#vehicle">Truck records</a><a href="#incidents">Incidents</a></div>
            <div><h3>Analysis</h3><a href="#compliance">Compliance</a><a href="#system">System health</a><a href="#product">Overview</a></div>
            <div><h3>Navigate</h3><a href="#why-celsyn">Why Celsyn</a><a href="#tour">Operating views</a><Link to={dashboardTarget}>Dashboard</Link></div>
          </div>
          <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} Celsyn.</span><a href="#landing-hero">Back to top ↑</a></div>
        </div>
      </footer>
    </div>
  );
}
