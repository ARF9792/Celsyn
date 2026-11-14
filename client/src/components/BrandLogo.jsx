export default function BrandLogo({ className = "" }) {
  return (
    <span className={`celsyn-mark ${className}`.trim()} aria-hidden="true">
      <img src="/celsyn-logo.png" alt="" />
    </span>
  );
}
