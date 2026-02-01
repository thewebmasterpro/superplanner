import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
    theme: "system",
    setTheme: () => null,
})

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "superplanner-theme",
    ...props
}) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement
        const html = document.querySelector('html')

        // Remove old classes
        root.classList.remove("light", "dark")
        html.classList.remove("light", "dark")

        let effectiveTheme = theme

        if (theme === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        }

        // Apply theme to all possible root elements for reliability
        root.setAttribute("data-theme", effectiveTheme)
        html.setAttribute("data-theme", effectiveTheme)
        document.body.setAttribute("data-theme", effectiveTheme)

        // For Tailwind class-based dark mode support
        const darkThemes = ["dark", "halloween", "forest", "black", "luxury", "dracula", "business", "night", "coffee", "dim", "sunset"]
        if (darkThemes.includes(effectiveTheme)) {
            root.classList.add("dark")
            html.classList.add("dark")
        } else {
            root.classList.add("light")
            html.classList.add("light")
        }
    }, [theme])

    const value = {
        theme,
        setTheme: (newTheme) => {
            localStorage.setItem(storageKey, newTheme)
            setTheme(newTheme)
            // Force a slight delay then trigger layout update
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'))
            }, 100)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
    return context
}
