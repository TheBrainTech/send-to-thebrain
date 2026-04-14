import React from "react";
import { createRoot } from "react-dom/client";
import "../styles/globals.css";
import { OptionsApp } from "./OptionsApp";

const container = document.getElementById("root");
if(!container) {
	throw new Error("Missing #root element");
}
createRoot(container).render(
	<React.StrictMode>
		<OptionsApp />
	</React.StrictMode>,
);
