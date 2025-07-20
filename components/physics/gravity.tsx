"use client"

import { useMemo } from "react"
import { Gravity, MatterBody } from "./matter-components"

export default function PhysicsPreview() {
  const physicsContent = useMemo(() => (
    <div className="w-full h-full flex flex-col relative">
      <Gravity gravity={{ x: 0, y: 1 }} className="w-full h-full" debug={false}>
        <MatterBody
          matterBodyOptions={{ 
            friction: 0.5, 
            restitution: 0.2,
            render: { fillStyle: 'rgb(34,45,134)' }
          }}
          x="45%"
          y="45%"
          bodyType="circle"
        >
          <div className="w-32 h-32" />
        </MatterBody>
        <MatterBody
          matterBodyOptions={{ 
            friction: 0.5, 
            restitution: 0.2,
            render: { fillStyle: 'rgb(34,45,134)' }
          }}
          x="55%"
          y="55%"
          bodyType="circle"
        >
          <div className="w-40 h-40" />
        </MatterBody>
        <MatterBody
          matterBodyOptions={{ 
            friction: 0.5, 
            restitution: 0.2,
            render: { fillStyle: 'rgb(245,245,245)' }
          }}
          x="50%"
          y="50%"
          bodyType="circle"
        >
          <div className="w-48 h-48" />
        </MatterBody>
        <MatterBody
          matterBodyOptions={{ 
            friction: 0.5, 
            restitution: 0.2,
            render: { fillStyle: 'rgb(245,245,245)' }
          }}
          x="48%"
          y="52%"
          bodyType="circle"
        >
          <div className="w-24 h-24" />
        </MatterBody>
        <MatterBody
          matterBodyOptions={{ 
            friction: 0.5, 
            restitution: 0.2,
            render: { fillStyle: 'rgb(245,245,245)' }
          }}
          x="52%"
          y="48%"
          bodyType="circle"
        >
          <div className="w-56 h-56" />
        </MatterBody>
      </Gravity>
    </div>
  ), []);

  return physicsContent;
}