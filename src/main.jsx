- import { BrowserRouter } from "react-router-dom";
+ import { HashRouter } from "react-router-dom";
…
- createRoot(document.getElementById("root")).render(
-   <BrowserRouter>
-     <App />
-   </BrowserRouter>
- );
+ createRoot(document.getElementById("root")).render(
+   <HashRouter>
+     <App />
+   </HashRouter>
+ );
