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
      <ReduxProvider>
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="mb-4 text-center">
            <h1 className="text-xl font-bold text-white font-display">Follow Up Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Mobile View Simulation</p>
          </div>
          
          <div className="relative w-full max-w-[400px] h-[85vh] rounded-[48px] border-[10px] border-slate-800 bg-white shadow-2xl overflow-hidden flex flex-col">
            {/* Camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-800 rounded-b-2xl z-40 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full mb-1"></div>
            </div>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden dark bg-zinc-950 text-zinc-100">
              <div className="nav shrink-0">
                <Header />
              </div>
              <div
                className="body flex-1 overflow-auto bg-zinc-950/20"
                style={{
                  height: "calc(100% - 65px)",
                }}
              >
                <Component {...pageProps} />
              </div>
            </div>
          </div>
        </div>
      </ReduxProvider>
    );
  }

  return (
    <>
      <ReduxProvider>
        <div className="dark bg-zinc-950 text-zinc-100 min-h-screen flex flex-col">
          <div className="nav shrink-0">
            <Header />
          </div>
          <div
            className="body flex-1 overflow-auto bg-zinc-950/20"
            style={{
              height: "calc(100vh - 65px)",
            }}
          >
            <Component {...pageProps} />
          </div>
        </div>
      </ReduxProvider>
    </>
  );
}
