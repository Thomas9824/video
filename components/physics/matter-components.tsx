"use client";

import React, { useRef, useEffect, ReactNode } from 'react';
import Matter from 'matter-js';

interface GravityProps {
  gravity?: { x: number; y: number };
  className?: string;
  debug?: boolean;
  children: ReactNode;
}

interface MatterBodyProps {
  matterBodyOptions?: Matter.IBodyDefinition;
  x?: string | number;
  y?: string | number;
  angle?: number;
  bodyType?: 'rectangle' | 'circle' | 'svg';
  children: ReactNode;
}

export function Gravity({ gravity = { x: 0, y: 1 }, className = '', debug = false, children }: GravityProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const [isEngineReady, setIsEngineReady] = React.useState(false);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Cleanup previous instances first
    setIsEngineReady(false);
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      if (sceneRef.current && renderRef.current.canvas && sceneRef.current.contains(renderRef.current.canvas)) {
        sceneRef.current.removeChild(renderRef.current.canvas);
      }
      renderRef.current = null;
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
      runnerRef.current = null;
    }

    // Add a small delay to ensure DOM is fully ready
    const initTimeout = setTimeout(() => {
      if (!sceneRef.current) return;

      // Create engine
      const engine = Matter.Engine.create();
      engineRef.current = engine;
      
      // Set gravity using the new API
      engine.world.gravity.x = gravity.x;
      engine.world.gravity.y = gravity.y;

      // Create boundaries with some padding from the container edges
      const containerWidth = sceneRef.current.clientWidth;
      const containerHeight = sceneRef.current.clientHeight;
      
      // Add minimal padding to keep objects away from the very edges
      const wallPadding = 0;
      const wallThickness = 5;
      
      const walls = [
        // Bottom wall
        Matter.Bodies.rectangle(
          containerWidth / 2, 
          containerHeight - wallPadding - wallThickness/2, 
          containerWidth - (wallPadding * 2), 
          wallThickness, 
          { 
            isStatic: true, 
            friction: 0.3, 
            restitution: 0.6,
            render: { visible: false }
          }
        ),
        // Top wall
        Matter.Bodies.rectangle(
          containerWidth / 2, 
          wallPadding + wallThickness/2, 
          containerWidth - (wallPadding * 2), 
          wallThickness, 
          { 
            isStatic: true, 
            friction: 0.3, 
            restitution: 0.6,
            render: { visible: false }
          }
        ),
        // Left wall
        Matter.Bodies.rectangle(
          wallPadding + wallThickness/2, 
          containerHeight / 2, 
          wallThickness, 
          containerHeight - (wallPadding * 2), 
          { 
            isStatic: true, 
            friction: 0.3, 
            restitution: 0.6,
            render: { visible: false }
          }
        ),
        // Right wall
        Matter.Bodies.rectangle(
          containerWidth - wallPadding - wallThickness/2, 
          containerHeight / 2, 
          wallThickness, 
          containerHeight - (wallPadding * 2), 
          { 
            isStatic: true, 
            friction: 0.3, 
            restitution: 0.6,
            render: { visible: false }
          }
        )
      ];
      
      // Add walls to world FIRST
      Matter.World.add(engine.world, walls);

      // Create renderer
      const render = Matter.Render.create({
        element: sceneRef.current,
        engine: engine,
        options: {
          width: sceneRef.current.clientWidth,
          height: sceneRef.current.clientHeight,
          wireframes: false,
          background: 'transparent',
          showDebug: debug,
          showVelocity: debug,
          showAngleIndicator: debug,
          showBounds: false,
        }
      });
      renderRef.current = render;

      // Add mouse control for dragging
      const mouse = Matter.Mouse.create(render.canvas);
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.8,
          damping: 0.1,
          render: {
            visible: false
          }
        }
      });
      mouseConstraintRef.current = mouseConstraint;
      Matter.World.add(engine.world, mouseConstraint);

      // Keep the mouse in sync with the render
      render.mouse = mouse;

      // Run the engine and renderer
      Matter.Render.run(render);
      const runner = Matter.Runner.create();
      runnerRef.current = runner;
      Matter.Runner.run(runner, engine);
      
      // Mark engine as ready
      setIsEngineReady(true);
    }, 200);

    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (mouseConstraintRef.current && engineRef.current) {
        Matter.World.remove(engineRef.current.world, mouseConstraintRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
      if (sceneRef.current && renderRef.current?.canvas && sceneRef.current.contains(renderRef.current.canvas)) {
        sceneRef.current.removeChild(renderRef.current.canvas);
      }
      
      // Reset refs
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      mouseConstraintRef.current = null;
    };
  }, [gravity.x, gravity.y, debug]);

  return (
    <div className={className} style={{ position: 'relative' }} data-physics-container>
      <div ref={sceneRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
      <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none', visibility: 'hidden' }}>
        {isEngineReady && React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === MatterBody) {
            return React.cloneElement(child as React.ReactElement<MatterBodyProps>, {
              key: index,
              engine: engineRef.current
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function MatterBody({ 
  matterBodyOptions = {}, 
  x = '50%', 
  y = '50%', 
  angle = 0,
  bodyType = 'rectangle',
  children,
  engine
}: MatterBodyProps & { engine?: Matter.Engine }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const matterBodyRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    if (!bodyRef.current || !engine) return;

    const element = bodyRef.current;
    const rect = element.getBoundingClientRect();
    
    // Find the physics container (the one with the canvas)
    const physicsContainer = element.closest('[data-physics-container]') as HTMLElement;
    if (!physicsContainer) return;
    
    const containerRect = physicsContainer.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate position within the physics container bounds
    // Add minimal padding to ensure objects spawn well inside the container
    const padding = 20;
    const safeWidth = containerRect.width - (padding * 2);
    const safeHeight = containerRect.height - (padding * 2);
    
    const xPos = typeof x === 'string' && x.includes('%') 
      ? padding + (parseFloat(x) / 100) * safeWidth
      : typeof x === 'number' ? x : parseFloat(x as string);
    
    const yPos = typeof y === 'string' && y.includes('%') 
      ? padding + (parseFloat(y) / 100) * safeHeight
      : typeof y === 'number' ? y : parseFloat(y as string);

    // Create matter body based on type
    let body: Matter.Body;
    
    switch (bodyType) {
      case 'circle':
        body = Matter.Bodies.circle(xPos, yPos, Math.min(rect.width, rect.height) / 2, matterBodyOptions);
        break;
      case 'svg':
        // For SVG, we'll use a rectangle for now (could be enhanced to use actual SVG path)
        body = Matter.Bodies.rectangle(xPos, yPos, rect.width, rect.height, matterBodyOptions);
        break;
      default:
        body = Matter.Bodies.rectangle(xPos, yPos, rect.width, rect.height, matterBodyOptions);
    }

    // Set initial angle
    Matter.Body.setAngle(body, (angle * Math.PI) / 180);

    // Add to world
    Matter.World.add(engine.world, body);
    matterBodyRef.current = body;

    // Update element position based on physics
    const updatePosition = () => {
      if (matterBodyRef.current && bodyRef.current) {
        const position = matterBodyRef.current.position;
        const angle = matterBodyRef.current.angle;
        
        bodyRef.current.style.transform = `translate(${position.x - rect.width/2}px, ${position.y - rect.height/2}px) rotate(${angle}rad)`;
      }
      requestAnimationFrame(updatePosition);
    };
    updatePosition();

    return () => {
      if (matterBodyRef.current) {
        Matter.World.remove(engine.world, matterBodyRef.current);
      }
    };
  }, [engine, x, y, angle, bodyType, matterBodyOptions]);

  return (
    <div 
      ref={bodyRef}
      style={{ 
        position: 'absolute',
        transformOrigin: 'center center'
      }}
    >
      {children}
    </div>
  );
}