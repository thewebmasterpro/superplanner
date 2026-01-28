import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="relative w-9 h-9 rounded-full overflow-hidden"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {theme === "light" ? (
                        <Sun className="h-5 w-5 text-amber-500" />
                    ) : (
                        <Moon className="h-5 w-5 text-blue-400" />
                    )}
                </motion.div>
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
