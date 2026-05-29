import { useState, useEffect } from 'react';

export function useMapmyIndia() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).MapmyIndia) {
      setLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_MAPMYINDIA_API_KEY || import.meta.env.VITE_MAPPLS_API_KEY || '';
    if (!apiKey) return;

    const loadScripts = async () => {
      // Load main map script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/map_load?v=1.5`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // Load plugins script for autoSuggest etc.
      await new Promise<void>((resolve, reject) => {
        const pluginScript = document.createElement('script');
        pluginScript.src = `https://apis.mapmyindia.com/advancedmaps/api/${apiKey}/map_sdk_plugins`;
        pluginScript.async = true;
        pluginScript.onload = () => resolve();
        pluginScript.onerror = reject;
        document.head.appendChild(pluginScript);
      });

      setLoaded(true);
    };

    loadScripts().catch(console.error);

  }, []);

  return loaded;
}
