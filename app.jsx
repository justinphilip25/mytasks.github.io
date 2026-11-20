import CameraApp from "./components/CameraApp.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-mark">Lens</span>
        <span className="app-sub">on-device AI camera</span>
      </header>
      <CameraApp />
      <footer className="app-footer">
        All detection runs locally in your browser — nothing is uploaded.
      </footer>
    </div>
  );
}
