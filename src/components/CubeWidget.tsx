import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface CubeWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
  brightnessMode?: string;
}

const webGlSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!context;
  } catch {
    return false;
  }
};

const buildProceduralStripeTexture = (): HTMLCanvasElement => {
  const size = 512;
  const stripeWidth = 3;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  context.clearRect(0, 0, size, size);

  // Base gradient pass.
  const baseGradient = context.createLinearGradient(0, 0, size, size);
  baseGradient.addColorStop(0, '#1a1a1a');
  baseGradient.addColorStop(1, '#4a4a4a');
  context.fillStyle = baseGradient;
  context.globalAlpha = 0.22;
  context.fillRect(0, 0, size, size);

  context.globalAlpha = 0.16;
  context.strokeStyle = '#f4f7ff';
  context.lineWidth = stripeWidth;

  for (let offset = -size; offset < size * 2; offset += stripeWidth * 4) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - size, size);
    context.stroke();
  }

  context.globalAlpha = 0.08;
  for (let row = 0; row < size; row += 2) {
    for (let col = 0; col < size; col += 2) {
      const randomValue = Math.sin((row * 13.1 + col * 7.7) * 0.017) * 0.5 + 0.5;
      if (randomValue > 0.74) {
        context.fillStyle = `rgba(255,255,255,${(randomValue - 0.74) * 0.7})`;
        context.fillRect(col, row, 2, 2);
      }
    }
  }

  context.globalAlpha = 1;
  return canvas;
};

const CubeWidget = ({ className, visualRegressionMode }: CubeWidgetProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webGlReady = useMemo(() => webGlSupported(), []);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;

    if (!webGlReady || !mount || visualRegressionMode) {
      return undefined;
    }

    let disposed = false;
    let frameId = 0;

    const setup = async () => {
      setLoadingProgress(10);
      const THREE = await import('three');
      if (disposed) {
        return;
      }

      setLoadingProgress(24);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#030406');
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

      camera.position.set(0, 0, 4.2);

      const size = mount.clientWidth;
      renderer.setSize(size, size, false);
      renderer.domElement.className = 'cube-webgl-canvas';
      mount.appendChild(renderer.domElement);

      setLoadingProgress(40);

      const stripeCanvas = buildProceduralStripeTexture();
      const stripeTexture = new THREE.CanvasTexture(stripeCanvas);
      stripeTexture.wrapS = THREE.RepeatWrapping;
      stripeTexture.wrapT = THREE.RepeatWrapping;
      stripeTexture.repeat.set(1.35, 1.35);
      stripeTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      stripeTexture.needsUpdate = true;

      /* Lines 96-107 omitted */
      const numCubes = 3;
      const cubeSize = 0.45;
      const spacing = 0.05;
      const offset = ((numCubes - 1) * (cubeSize + spacing)) / 2;

      const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const edges = new THREE.EdgesGeometry(geometry);
      
      const group = new THREE.Group();
      const blocks: InstanceType<typeof THREE.LineSegments>[] = [];

      for (let x = 0; x < numCubes; x++) {
        for (let y = 0; y < numCubes; y++) {
          for (let z = 0; z < numCubes; z++) {
            const material = new THREE.LineBasicMaterial({
              color: '#00ffff',
              linewidth: 2,
              transparent: true,
              opacity: 0.5
            });
            const block = new THREE.LineSegments(edges, material);
            block.position.set(
              x * (cubeSize + spacing) - offset,
              y * (cubeSize + spacing) - offset,
              z * (cubeSize + spacing) - offset
            );
            // Save logical coordinates for group patterns
            block.userData = { x, y, z };
            group.add(block);
            blocks.push(block);
          }
        }
      }

      scene.add(group);
      
      // Store the main object for rotation
      const mainCube = group;
      /* Lines 108-115 omitted */

      const floorMaterial = new THREE.ShadowMaterial({
        opacity: 0.26,
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.38;
      floor.receiveShadow = true;
      scene.add(floor);

      const keyLight = new THREE.DirectionalLight('#fff1db', 1.15);
      keyLight.position.set(3.2, 2.8, 2.7);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.00018;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.camera.left = -4;
      keyLight.shadow.camera.right = 4;
      keyLight.shadow.camera.top = 4;
      keyLight.shadow.camera.bottom = -4;

      const fillLight = new THREE.DirectionalLight('#d8e8ff', 0.66);
      fillLight.position.set(-2.9, 1.4, 2.3);

      const rimLight = new THREE.DirectionalLight('#88a8ff', 0.78);
      rimLight.position.set(0.6, 2.1, -3.3);

      const ambient = new THREE.AmbientLight('#7d93c8', 0.44);

      scene.add(ambient);
      scene.add(keyLight);
      scene.add(fillLight);
      scene.add(rimLight);
      scene.add(keyLight.target);
      scene.add(fillLight.target);
      scene.add(rimLight.target);

      const baseKeyDirection = keyLight.position.clone().normalize();
      const baseFillDirection = fillLight.position.clone().normalize();
      const baseRimDirection = rimLight.position.clone().normalize();

      const keyDistance = keyLight.position.length();
      const fillDistance = fillLight.position.length();
      const rimDistance = rimLight.position.length();

      const rotationQuaternion = new THREE.Quaternion();

      setLoadingProgress(70);

      const cycleMs = 6_000; // Increased rotation speed
      const radiansPerMs = (Math.PI * 2) / cycleMs;
      let lastTime = performance.now();

      const onResize = () => {
        const nextSize = mount.clientWidth;
        renderer.setSize(nextSize, nextSize, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      };

      const renderLoop = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;
        const timeSec = time * 0.001;

        // Animation Timeline: 14 second loop
        const loopDuration = 14.0;
        const cycleT = timeSec % loopDuration;
        
        let progress = 0;
        if (cycleT < 4.0) {
          // Phase 1: Assembly (0-4s)
          const p = cycleT / 4.0;
          progress = 1 - Math.pow(1 - p, 4); // Quartic ease-out
        } else if (cycleT < 9.0) {
          // Phase 2: Formed & Spinning (4-9s, minimum 5 seconds holds fully formed)
          progress = 1.0;
        } else {
          // Phase 3: Disassembly outwards (9-14s)
          const p = (cycleT - 9.0) / 5.0;
          progress = 1 - Math.pow(p, 2); // Quadratic ease-in
        }

        // Entire cube spins faster when fully formed
        const currentSpeed = radiansPerMs * (0.1 + 0.9 * progress);
        mainCube.rotation.x += currentSpeed * delta;
        mainCube.rotation.y += currentSpeed * delta;

        const numCubes = 3;
        const cubeSize = 0.45;
        const spacing = 0.05;
        const offset = ((numCubes - 1) * (cubeSize + spacing)) / 2;

        // Dynamic block highlighting & assembly system
        blocks.forEach((block, index) => {
          const mat = block.material as InstanceType<typeof THREE.LineBasicMaterial>;
          const { x, y, z } = block.userData;
          
          // Original target grid positions
          const targetX = x * (cubeSize + spacing) - offset;
          const targetY = y * (cubeSize + spacing) - offset;
          const targetZ = z * (cubeSize + spacing) - offset;

          // Exploded scattered positions (multiplied outward with some chaos)
          const explodeDist = 3.5;
          const explodeX = targetX * explodeDist + (x - 1) * 2;
          const explodeY = targetY * explodeDist + Math.sin(index * 0.5) * 2;
          const explodeZ = targetZ * explodeDist + Math.cos(index * 0.5) * 2;

          // Interpolate spatial position
          block.position.x = explodeX + (targetX - explodeX) * (1 - progress) + targetX * progress;
          block.position.y = explodeY + (targetY - explodeY) * (1 - progress) + targetY * progress;
          block.position.z = explodeZ + (targetZ - explodeZ) * (1 - progress) + targetZ * progress;

          block.position.x = explodeX * (1 - progress) + targetX * progress;
          block.position.y = explodeY * (1 - progress) + targetY * progress;
          block.position.z = explodeZ * (1 - progress) + targetZ * progress;

          // Interpolate individual rotation
          block.rotation.x = (1 - progress) * (x * Math.PI + timeSec * 2);
          block.rotation.y = (1 - progress) * (y * Math.PI + timeSec * 2);
          block.rotation.z = (1 - progress) * (z * Math.PI + timeSec * 2);

          // Complex grouped pattern: pulsing wave from center
          const distToCenter = Math.sqrt(Math.pow(x - 1, 2) + Math.pow(y - 1, 2) + Math.pow(z - 1, 2));
          const wavePhase = Math.sin(timeSec * 3 - distToCenter * 1.5);
          
          // Random spike for individual blocks
          const randPulse = Math.sin(timeSec * 5 + index * 4);

          // Multi-level highlight states (Only trigger full synthwave when fully assembled)
          if (progress > 0.95) {
            if (wavePhase > 0.8 || randPulse > 0.95) {
              // High-intensity active state (Neon Magenta)
              mat.color.setHex(0xff007c);
              mat.opacity = 1.0;
            } else if (wavePhase > 0.3) {
              // Medium highlight state (Electric Cyan)
              mat.color.setHex(0x00f0ff);
              mat.opacity = 0.7;
            } else if (distToCenter === 0) {
              // Core glow (Vibrant Yellow)
              mat.color.setHex(0xffe600);
              mat.opacity = 1.0;
            } else {
              // Base state (Deep Violet)
              mat.color.setHex(0x2a0845);
              mat.opacity = 0.35;
            }
          } else {
            // While forming/exploding, show pure cyan structural lines with expanding opacity
            mat.color.setHex(0x00f0ff);
            mat.opacity = 0.1 + (0.7 * progress);
          }
        });

        rotationQuaternion.copy(mainCube.quaternion);

        keyLight.position
          .copy(baseKeyDirection)
          .applyQuaternion(rotationQuaternion)
          .multiplyScalar(keyDistance);
        fillLight.position
          .copy(baseFillDirection)
          .applyQuaternion(rotationQuaternion)
          .multiplyScalar(fillDistance);
        rimLight.position
          .copy(baseRimDirection)
          .applyQuaternion(rotationQuaternion)
          .multiplyScalar(rimDistance);

        keyLight.target.position.set(0, 0, 0);
        fillLight.target.position.set(0, 0, 0);
        rimLight.target.position.set(0, 0, 0);

        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(renderLoop);
      };

      window.addEventListener('resize', onResize);
      setLoadingProgress(88);
      frameId = window.requestAnimationFrame(renderLoop);
      setLoadingProgress(100);

      const cleanup = () => {
        window.removeEventListener('resize', onResize);
        window.cancelAnimationFrame(frameId);

        geometry.dispose();
        edges.dispose();
        blocks.forEach((block) => {
          (block.material as InstanceType<typeof THREE.LineBasicMaterial>).dispose();
        });
        floor.geometry.dispose();
        floorMaterial.dispose();
        stripeTexture.dispose();
        renderer.dispose();

        if (renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      };

      (mount as HTMLDivElement & { __cubeCleanup?: () => void }).__cubeCleanup = cleanup;
    };

    setup();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);

      const storedMount = mount as HTMLDivElement & { __cubeCleanup?: () => void };
      storedMount.__cubeCleanup?.();
      delete storedMount.__cubeCleanup;
    };
  }, [visualRegressionMode, webGlReady]);

  const cssStyle = {
    '--cube-duration': '12s',
  } as CSSProperties;

  return (
    <div className={`cube-widget ${className || ''}`.trim()} style={cssStyle}>
      <div ref={mountRef} className={`cube-webgl-mount ${webGlReady && !visualRegressionMode ? 'is-active' : ''}`} aria-hidden="true" />
      {webGlReady && !visualRegressionMode && loadingProgress < 100 ? (
        <div className="cube-loading-progress" role="status" aria-live="polite">
          <span>{`3D ${Math.round(loadingProgress)}%`}</span>
          <i>
            <b style={{ width: `${loadingProgress}%` }} />
          </i>
        </div>
      ) : null}
      <div className={`cube-css-fallback ${webGlReady && !visualRegressionMode ? 'is-hidden' : ''}`} aria-hidden="true">
        <div className="cube-css-scene">
          <div className="cube-face front" />
          <div className="cube-face back" />
          <div className="cube-face right" />
          <div className="cube-face left" />
          <div className="cube-face top" />
          <div className="cube-face bottom" />
        </div>
      </div>
    </div>
  );
};

export default memo(CubeWidget);
