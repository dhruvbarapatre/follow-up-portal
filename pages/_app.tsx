import Header from "@/components/Navbar";
import ReduxProvider from "@/components/Provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth > 768); // tablet size max.
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isLargeScreen) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '50px', fontWeight: 'bold' }}>
        ❌ This application is not supported on large screens. Please use a tablet or mobile device.
      </div>
    );
  }
  return (
    <>
        <ReduxProvider>
          <div>
            <div className="nav">
              <Header />
            </div>
            <div
              className="body"
              style={{
                height: "calc(100vh - 65px)",
                overflow: "auto",
                backgroundColor: "paleturquoise",
              }}
            >
              <Component {...pageProps} />
            </div>
          </div>
        </ReduxProvider>
    </>
  );
}
