export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Tally Endpoint</h1>
      <p>
        POST stats to <code>/api/tally</code>, GET them back from the same URL.
      </p>
    </main>
  );
}
