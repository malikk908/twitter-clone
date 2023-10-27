import type { ReactNode } from "react"

type IconHoverEffectProps = {
    children: ReactNode
    red?: boolean
}

export function IconHoverEffect({
    children,
    red
}: IconHoverEffectProps) {

    const colorClasses = red ? "outline-red-400 hover:bg-red-200" : "outline-gray-400 hover:bg-gray-200"

    return (
        <div className={`rounded-full p-2 transition-colors duration-200 ${colorClasses}`}>
            {children}
        </div>
    )
}