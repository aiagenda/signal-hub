import { getGa4MeasurementId, getPlausibleDomain } from "@/lib/public-env";

/**
 * Client-visible analytics (first-party script tags). Respect GDPR: disclose in Footer / About.
 */
export function AnalyticsScripts() {
  const plausible = getPlausibleDomain();
  const ga4 = getGa4MeasurementId();

  return (
    <>
      {plausible ? (
        <script defer data-domain={plausible} src="https://plausible.io/js/script.js" />
      ) : null}
      {ga4 ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4}', { anonymize_ip: true });
`,
            }}
          />
        </>
      ) : null}
    </>
  );
}
