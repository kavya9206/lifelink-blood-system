import * as React from "react";
const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(undefined);
    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        // State updates happen inside the media-query change callback and a
        // microtask — never synchronously in the effect body.
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        Promise.resolve().then(onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    return !!isMobile;
}
