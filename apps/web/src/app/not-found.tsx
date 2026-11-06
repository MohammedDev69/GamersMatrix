import Link from "next/link";

export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#06050A",
        color: "#F7F3FC",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
          404 — Page not found
        </h1>
        <p style={{ color: "#C8BDD7", marginBottom: "1.5rem" }}>
          The page you requested does not exist.
        </p>
        <Link
          href="/ar"
          style={{
            color: "#B96AFF",
            textDecoration: "underline",
          }}
        >
          Go to storefront
        </Link>
      </div>
    </main>
  );
}
