import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface AnimatedStarsProps {
    count?: number;
    className?: string;
}

interface StarPosition {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

export const AnimatedStars = ({ count = 15, className = "" }: AnimatedStarsProps) => {
    const [stars, setStars] = useState<StarPosition[]>([]);

    useEffect(() => {
        const generateStars = () => {
            const newStars: StarPosition[] = [];
            for (let i = 0; i < count; i++) {
                newStars.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
                    delay: Math.random() * 3,
                    duration: Math.random() * 2 + 2, // 2 to 4 seconds
                });
            }
            setStars(newStars);
        };

        generateStars();
    }, [count]);

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute animate-float"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        animationDelay: `${star.delay}s`,
                        animationDuration: `${star.duration}s`,
                        transform: `scale(${star.size})`,
                    }}
                >
                    <Star
                        className="text-yellow-400/60 w-4 h-4 drop-shadow-glow"
                        fill="currentColor"
                    />
                </div>
            ))}
        </div>
    );
}; 