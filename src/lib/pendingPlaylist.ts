// A playlist link pasted on the landing page before signing in. Sign-in brings
// the learner back to "/", which sends them on to Courses with it filled in.
const KEY = "zverts.pendingPlaylist";

export const savePendingPlaylist = (url: string) => {
    try {
        sessionStorage.setItem(KEY, url);
    } catch {
        /* storage unavailable: they paste it again after signing in */
    }
};

/** Returns the saved link once, then forgets it. */
export const takePendingPlaylist = (): string | null => {
    try {
        const v = sessionStorage.getItem(KEY);
        sessionStorage.removeItem(KEY);
        return v;
    } catch {
        return null;
    }
};
