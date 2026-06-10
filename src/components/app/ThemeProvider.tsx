import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
export const ThemeProvider = ({ children }: { children: ReactNode }) => (
    <NextThemesProvider attribute="class" enableSystem={true} defaultTheme="system">
        {children}
    </NextThemesProvider>
);
