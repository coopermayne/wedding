import { isConfigured, sanitizeNext } from "@/lib/auth";
import { unlock } from "./actions";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function Gate({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = sanitizeNext(next);
  const configured = isConfigured();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 text-center my-16">
      <div className="text-center mb-2">
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~*~*~*~</p>
        <h1 className="text-3xl md:text-4xl font-bold my-3">
          <span style={{ color: "#cc0000" }}>E</span>
          <span style={{ color: "#ff6600" }}>m</span>
          <span style={{ color: "#cccc00" }}>i</span>
          <span style={{ color: "#009900" }}>l</span>
          <span style={{ color: "#0000cc" }}>y</span>
          <span className="text-2xl mx-2">&amp;</span>
          <span style={{ color: "#9900cc" }}>M</span>
          <span style={{ color: "#cc0000" }}>a</span>
          <span style={{ color: "#ff6600" }}>x</span>
        </h1>
        <p className="text-sm">~*~*~*~*~*~*~*~*~*~*~*~*~*~</p>
      </div>

      <hr className="rainbow-hr my-4" />

      <div className="bevel-in p-6 my-6">
        <p className="comic text-base mb-4" style={{ color: "#cc00cc" }}>
          &#9829; This site is private &#9829;
        </p>

        {configured ? (
          <>
            <p className="text-sm mb-4" style={{ color: "#666666" }}>
              Please enter the password from your invitation to come in.
            </p>
            <form action={unlock} className="flex flex-col items-center gap-3">
              <input type="hidden" name="next" value={safeNext} />
              <input
                type="password"
                name="password"
                autoFocus
                required
                autoComplete="current-password"
                placeholder="Password"
                aria-label="Password"
                className="bevel-in px-3 py-2 text-base text-center w-full max-w-xs"
              />
              <button type="submit" className="btn-90s">
                Enter &raquo;
              </button>
            </form>
            {error && (
              <p className="comic text-sm mt-4" style={{ color: "#cc0000" }}>
                &#10007; That password isn&apos;t right &mdash; try again.
              </p>
            )}
          </>
        ) : (
          <p className="comic text-sm" style={{ color: "#cc0000" }}>
            The site password has not been configured yet. Set the{" "}
            <span className="courier">SITE_PASSWORD</span> environment variable.
          </p>
        )}
      </div>

      <hr className="rainbow-hr my-4" />
    </div>
  );
}
