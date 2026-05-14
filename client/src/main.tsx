import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as ChakraProvider } from "./components/ui/provider.tsx";
import { store } from "./store/store.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </ReduxProvider>
  </React.StrictMode>,
);
