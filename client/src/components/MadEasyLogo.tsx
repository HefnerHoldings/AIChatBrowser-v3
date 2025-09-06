import { cn } from '@/lib/utils';

interface MadEasyLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  animated?: boolean;
  className?: string;
  showText?: boolean;
}

export function MadEasyLogo({ 
  size = 'medium', 
  animated = false, 
  className,
  showText = false 
}: MadEasyLogoProps) {
  const dimensions = {
    small: { width: 24, height: 24, strokeWidth: 1.5 },
    medium: { width: 40, height: 40, strokeWidth: 2 },
    large: { width: 80, height: 80, strokeWidth: 2.5 },
    xlarge: { width: 120, height: 120, strokeWidth: 3 }
  };

  const { width, height, strokeWidth } = dimensions[size];
  const textSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-xl',
    xlarge: 'text-3xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "transition-transform",
          animated && "animate-pulse-subtle"
        )}
      >
        {/* Outer neural ring */}
        <g className={animated ? "animate-spin-slow" : ""}>
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#neuralGradient)"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />
          
          {/* Neural nodes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 45 * Math.cos(rad);
            const y = 50 + 45 * Math.sin(rad);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="url(#nodeGradient)"
                  className={animated ? "animate-pulse" : ""}
                  style={{ animationDelay: `${i * 100}ms` }}
                />
                {/* Neural connections */}
                <line
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="url(#connectionGradient)"
                  strokeWidth={strokeWidth / 2}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </g>

        {/* Center compass core */}
        <g>
          {/* Compass rose */}
          <path
            d="M50 25 L55 45 L50 35 L45 45 Z"
            fill="url(#compassNorth)"
            opacity="0.9"
          />
          <path
            d="M50 75 L55 55 L50 65 L45 55 Z"
            fill="url(#compassSouth)"
            opacity="0.7"
          />
          <path
            d="M25 50 L45 45 L35 50 L45 55 Z"
            fill="url(#compassWest)"
            opacity="0.7"
          />
          <path
            d="M75 50 L55 45 L65 50 L55 55 Z"
            fill="url(#compassEast)"
            opacity="0.7"
          />
          
          {/* Central AI core */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="url(#coreGradient)"
            className={animated ? "animate-pulse-glow" : ""}
          />
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#innerCore)"
          />
          
          {/* AI symbol in center */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            className="fill-white dark:fill-white"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            AI
          </text>
        </g>

        {/* Data flow particles */}
        {animated && (
          <g className="animate-orbit">
            {[0, 120, 240].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 30 * Math.cos(rad);
              const y = 50 + 30 * Math.sin(rad);
              return (
                <circle
                  key={`particle-${i}`}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="url(#particleGradient)"
                  opacity="0.8"
                />
              );
            })}
          </g>
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          
          <radialGradient id="nodeGradient">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </radialGradient>
          
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
          </linearGradient>
          
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>
          
          <radialGradient id="innerCore">
            <stop offset="0%" stopColor="#F3F4F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </radialGradient>
          
          <linearGradient id="compassNorth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          
          <linearGradient id="compassSouth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
          
          <linearGradient id="compassWest" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
          
          <linearGradient id="compassEast" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
          
          <radialGradient id="particleGradient">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </radialGradient>
        </defs>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent",
            textSize[size]
          )}>
            MadEasy
          </span>
          {size !== 'small' && (
            <span className={cn(
              "text-muted-foreground -mt-1",
              size === 'xlarge' ? 'text-lg' : size === 'large' ? 'text-xs' : 'text-[10px]'
            )}>
              AI Browser
            </span>
          )}
        </div>
      )}
    </div>
  );
}