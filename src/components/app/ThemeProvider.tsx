import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    {children}
  </NextThemesProvider>
);