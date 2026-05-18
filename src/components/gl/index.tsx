import { Canvas } from "@react-three/fiber";
import { Particles } from "./particles";

// Static control values (originally from leva)
const controls = {
  speed: 1.0,
  focus: 3.8,
  aperture: 1.79,
  size: 512,
  noiseScale: 0.6,
  noiseIntensity: 0.52,
  timeScale: 1,
  pointSize: 10.0,
  opacity: 0.8,
  planeScale: 10.0,
  useManualTime: false,
  manualTime: 0,
};

export const GL = ({ hovering }: { hovering: boolean }) => {
  const {
    speed,
    focus,
    aperture,
    size,
    noiseScale,
    noiseIntensity,
    timeScale,
    pointSize,
    opacity,
    planeScale,
    useManualTime,
    manualTime,
  } = controls;

  return (
    <div id="webgl">
      <Canvas
        camera={{
          position: [
            1.2629783123314589, 2.664606471394044, -1.8178993743288914,
          ],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#000"]} />
        <Particles
          speed={speed}
          aperture={aperture}
          focus={focus}
          size={size}
          noiseScale={noiseScale}
          noiseIntensity={noiseIntensity}
          timeScale={timeScale}
          pointSize={pointSize}
          opacity={opacity}
          planeScale={planeScale}
          useManualTime={useManualTime}
          manualTime={manualTime}
          introspect={hovering}
        />
      </Canvas>
    </div>
  );
};
