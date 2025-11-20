
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TimeTrackerProvider } from "./context/TimeTrackerContext";

createRoot(document.getElementById("root")!).render(
  <TimeTrackerProvider>
    <App />
  </TimeTrackerProvider>
);  