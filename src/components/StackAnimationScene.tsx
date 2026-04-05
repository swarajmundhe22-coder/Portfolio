import { memo, useEffect, useMemo, useRef, useState } from 'react';

interface StackAnimationSceneProps {
  className?: string;
  visualRegressionMode?: boolean;
}

const TOTAL_INSTANCES = 128;

const webGlSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(context);
  } catch {
    return false;
  }
};

const easeInOutCubic = (value: number): number =>
  value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;

const StackAnimationScene = ({ className, visualRegressionMode }: StackAnimationSceneProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webGlReady = useMemo(() => webGlSupported(), []);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeInstanceCount, setActiveInstanceCount] = useState(TOTAL_INSTANCES);

  const animationIds = useMemo(
    () => Array.from({ length: TOTAL_INSTANCES }, (_, index) => `stack-object-${index + 1}`),
    [],
  );

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount || !webGlReady) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let isVisible = true;
    let activeCount = TOTAL_INSTANCES;
    let averageFrameMs = 16;
    let lastLodUpdate = performance.now();
    let progressSettled = false;

    const setup = async () => {
      setLoadingProgress(8);
      const THREE = await import('three');

      if (disposed) {
        return;
      }

      setLoadingProgress(22);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'stack-scene-canvas';
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#020305');

      const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 80);
      camera.position.set(0, 0.45, 5.8);

      const keyLight = new THREE.DirectionalLight('#f7f1df', 1.08);
      keyLight.position.set(3.4, 2.5, 2.8);
      const fillLight = new THREE.DirectionalLight('#d8e8ff', 0.64);
      fillLight.position.set(-2.9, 1.3, 1.9);
      const rimLight = new THREE.DirectionalLight('#8ca9ff', 0.74);
      rimLight.position.set(0.4, 2.1, -3.6);
      const ambient = new THREE.AmbientLight('#5d6f9a', 0.42);

      scene.add(ambient);
      scene.add(keyLight);
      scene.add(fillLight);
      scene.add(rimLight);

      setLoadingProgress(40);

      const geometry = new THREE.BoxGeometry(0.96, 0.06, 0.58, 1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: '#1f2330',
        roughness: 0.34,
        metalness: 0.14,
        emissive: '#070b13',
        emissiveIntensity: 0.16,
      });

      const instanced = new THREE.InstancedMesh(geometry, material, TOTAL_INSTANCES);
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(instanced);

      const basePositions: Array<InstanceType<typeof THREE.Vector3>> = [];
      const baseRotations: Array<InstanceType<typeof THREE.Euler>> = [];
      const speedSeeds: number[] = [];

      const transform = new THREE.Object3D();
      const layers = 8;
      const perLayer = TOTAL_INSTANCES / layers;

      for (let index = 0; index < TOTAL_INSTANCES; index += 1) {
        const layer = Math.floor(index / perLayer);
        const ringIndex = index % perLayer;
        const normalized = ringIndex / perLayer;
        const angle = normalized * Math.PI * 2;
        const radius = 0.7 + layer * 0.18;

        const basePosition = new THREE.Vector3(
          Math.cos(angle) * radius,
          (layer - layers / 2) * 0.14,
          Math.sin(angle) * radius * 0.72,
        );
        const baseRotation = new THREE.Euler(0.35 + layer * 0.03, angle + Math.PI / 4, 0.12 * Math.sin(angle));

        basePositions.push(basePosition);
        baseRotations.push(baseRotation);
        speedSeeds.push(0.65 + (index % 11) * 0.045);

        transform.position.copy(basePosition);
        transform.rotation.copy(baseRotation);
        transform.updateMatrix();
        instanced.setMatrixAt(index, transform.matrix);
      }

      setLoadingProgress(58);

      const yAxis = new THREE.Vector3(0, 1, 0);
      const tempQuaternion = new THREE.Quaternion();
      const tempScale = new THREE.Vector3(1, 1, 1);
      const spinQuaternion = new THREE.Quaternion();

      const interaction = {
        target: 0,
        current: 0,
        lastMouseX: 0,
        lastMouseY: 0,
        lastScroll: window.scrollY,
        lastTouchX: 0,
        lastTouchY: 0,
      };

      const onMouseMove = (event: MouseEvent) => {
        const delta = Math.hypot(event.clientX - interaction.lastMouseX, event.clientY - interaction.lastMouseY);
        if (delta > 5) {
          interaction.target = 1;
        }

        interaction.lastMouseX = event.clientX;
        interaction.lastMouseY = event.clientY;
      };

      const onScroll = () => {
        const delta = Math.abs(window.scrollY - interaction.lastScroll);
        if (delta > 50) {
          interaction.target = 1;
        }

        interaction.lastScroll = window.scrollY;
      };

      const onTouchMove = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch) {
          return;
        }

        const delta = Math.hypot(
          touch.clientX - interaction.lastTouchX,
          touch.clientY - interaction.lastTouchY,
        );

        if (delta > 5) {
          interaction.target = 1;
        }

        interaction.lastTouchX = touch.clientX;
        interaction.lastTouchY = touch.clientY;
      };

      const onResize = () => {
        if (!mount) {
          return;
        }

        const width = mount.clientWidth;
        const height = mount.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('resize', onResize);

      setLoadingProgress(76);

      const observer = new IntersectionObserver(
        (entries) => {
          const currentlyVisible = entries.some((entry) => entry.isIntersecting);
          isVisible = currentlyVisible;

          if (!isVisible && frameId) {
            window.cancelAnimationFrame(frameId);
            frameId = 0;
          }

          if (isVisible && !frameId) {
            frameId = window.requestAnimationFrame(renderLoop);
          }
        },
        {
          threshold: 0.15,
        },
      );

      observer.observe(mount);

      const rpm = 22;
      const radiansPerMs = (Math.PI * 2 * rpm) / (60 * 1000);
      let spin = 0;
      let lastFrameTime = performance.now();

      const renderLoop = (time: number) => {
        if (disposed || !isVisible) {
          return;
        }

        const delta = time - lastFrameTime;
        lastFrameTime = time;

        averageFrameMs = averageFrameMs * 0.91 + delta * 0.09;

        if (!visualRegressionMode && time - lastLodUpdate > 520) {
          if (averageFrameMs > 16.4 && activeCount > 64) {
            activeCount = Math.max(64, activeCount - 8);
            instanced.count = activeCount;
            setActiveInstanceCount(activeCount);
          } else if (averageFrameMs < 12.2 && activeCount < TOTAL_INSTANCES) {
            activeCount = Math.min(TOTAL_INSTANCES, activeCount + 4);
            instanced.count = activeCount;
            setActiveInstanceCount(activeCount);
          }
          lastLodUpdate = time;
        }

        if (!visualRegressionMode) {
          interaction.target *= 0.965;
          interaction.current += (interaction.target - interaction.current) * Math.min(1, delta / 180);
          spin += radiansPerMs * delta * (1 + easeInOutCubic(Math.min(1, interaction.current)) * 0.46);
        }

        const easedBoost = easeInOutCubic(Math.max(0, Math.min(1, interaction.current)));

        for (let index = 0; index < activeCount; index += 1) {
          const basePosition = basePositions[index];
          const baseRotation = baseRotations[index];
          const velocity = speedSeeds[index];

          const sway = visualRegressionMode
            ? 0
            : Math.sin(time * 0.0014 * velocity + index * 0.17) * 0.075;

          transform.position.copy(basePosition).applyAxisAngle(yAxis, spin * (0.48 + index * 0.0018));
          transform.position.y += sway * (1 + easedBoost * 0.55);

          tempQuaternion.setFromEuler(baseRotation);
          spinQuaternion.setFromAxisAngle(yAxis, spin + Math.sin(index * 0.2) * 0.08);
          tempQuaternion.multiply(spinQuaternion);

          tempScale.setScalar(1 + easedBoost * 0.035);
          transform.quaternion.copy(tempQuaternion);
          transform.scale.copy(tempScale);
          transform.updateMatrix();

          instanced.setMatrixAt(index, transform.matrix);
        }

        instanced.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);

        if (!progressSettled) {
          progressSettled = true;
          setLoadingProgress(100);
        }

        frameId = window.requestAnimationFrame(renderLoop);
      };

      frameId = window.requestAnimationFrame(renderLoop);

      const cleanup = () => {
        observer.disconnect();

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('resize', onResize);

        if (frameId) {
          window.cancelAnimationFrame(frameId);
        }

        geometry.dispose();
        material.dispose();
        renderer.dispose();

        if (renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      };

      (mount as HTMLDivElement & { __stackCleanup?: () => void }).__stackCleanup = cleanup;
    };

    void setup();

    return () => {
      disposed = true;

      const cleanupMount = mount as HTMLDivElement & { __stackCleanup?: () => void };
      cleanupMount.__stackCleanup?.();
      delete cleanupMount.__stackCleanup;
    };
  }, [visualRegressionMode, webGlReady]);

  return (
    <div
      className={`stack-animation-scene ${className || ''}`.trim()}
      data-animation-id={animationIds[0]}
    >
      <div ref={mountRef} className={`stack-scene-host ${webGlReady ? 'is-ready' : ''}`} aria-hidden="true" />

      <ul className="stack-animation-id-list" aria-hidden="true">
        {animationIds.map((id) => (
          <li key={id} data-animation-id={id} />
        ))}
      </ul>

      {!webGlReady ? <div className="stack-scene-fallback" aria-hidden="true" /> : null}

      {webGlReady && loadingProgress < 100 ? (
        <div className="stack-scene-progress" role="status" aria-live="polite">
          <span>{`3D Scene ${Math.round(loadingProgress)}%`}</span>
          <i>
            <b style={{ width: `${loadingProgress}%` }} />
          </i>
        </div>
      ) : null}

      <p className="stack-scene-caption">
        Animated layers <strong>{activeInstanceCount}</strong>
      </p>
    </div>
  );
};

export default memo(StackAnimationScene);
