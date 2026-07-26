"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

function addChair(
  scene: THREE.Scene,
  x: number,
  z: number,
  rotation: number,
  wood: THREE.Material,
) {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.68), wood);
  seat.position.y = 0.72;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.72), wood);
  back.position.set(0, 1.08, 0.3);
  back.rotation.x = -0.08;
  chair.add(back);

  [-0.29, 0.29].forEach((legX) => {
    [-0.25, 0.25].forEach((legZ) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.7, 0.08),
        wood,
      );
      leg.position.set(legX, 0.35, legZ);
      chair.add(leg);
    });
  });
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  scene.add(chair);
}

function addPalm(
  scene: THREE.Scene,
  x: number,
  z: number,
  scale: number,
  trunkMaterial: THREE.Material,
  leafMaterial: THREE.Material,
) {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.25, 4.7, 9),
    trunkMaterial,
  );
  trunk.position.y = 2.35;
  trunk.rotation.z = x > 0 ? -0.08 : 0.08;
  palm.add(trunk);

  for (let i = 0; i < 9; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 2.2, 4, 7),
      leafMaterial,
    );
    const angle = (i / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.95, 4.65, Math.sin(angle) * 0.95);
    leaf.rotation.z = Math.PI / 2.4;
    leaf.rotation.y = -angle;
    palm.add(leaf);
  }

  palm.position.set(x, 0, z);
  palm.scale.setScalar(scale);
  scene.add(palm);
}

function createGarden(
  canvas: HTMLCanvasElement,
  progressRef: MutableRefObject<number>,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9c6c7);
  scene.fog = new THREE.FogExp2(0xb8cfbf, 0.013);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  camera.position.set(0, 3.9, 23);
  camera.lookAt(0, 2.1, -8);

  const hemi = new THREE.HemisphereLight(0xe8f4e9, 0x394629, 2.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffedca, 4);
  sun.position.set(-8, 15, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d7339,
    roughness: 0.98,
  });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 90, 1, 1),
    grassMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -15;
  ground.receiveShadow = true;
  scene.add(ground);

  const aisleMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b6c3d,
    roughness: 0.82,
  });
  const aisle = new THREE.Mesh(
    new THREE.BoxGeometry(3.7, 0.12, 31),
    aisleMaterial,
  );
  aisle.position.set(0, 0.06, 3.5);
  aisle.receiveShadow = true;
  scene.add(aisle);

  for (let z = 18; z > -11; z -= 1.25) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(3.74, 0.018, 0.035),
      new THREE.MeshBasicMaterial({ color: 0x5f4028 }),
    );
    seam.position.set(0, 0.132, z);
    scene.add(seam);
  }

  const wood = new THREE.MeshStandardMaterial({
    color: 0x6c472e,
    roughness: 0.75,
  });
  for (let row = 0; row < 7; row += 1) {
    const z = 15 - row * 3.2;
    [-4.3, -6.3, 4.3, 6.3].forEach((x) =>
      addChair(scene, x, z, 0, wood),
    );
  }

  const stone = new THREE.MeshStandardMaterial({
    color: 0xa9a28d,
    roughness: 0.9,
  });
  const altar = new THREE.Group();
  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.9, 0.2, 0),
    new THREE.Vector3(-3.9, 3.4, 0),
    new THREE.Vector3(-3, 5.2, 0),
    new THREE.Vector3(0, 6.2, 0),
    new THREE.Vector3(3, 5.2, 0),
    new THREE.Vector3(3.9, 3.4, 0),
    new THREE.Vector3(3.9, 0.2, 0),
  ]);
  const arch = new THREE.Mesh(
    new THREE.TubeGeometry(archCurve, 36, 0.34, 8, false),
    stone,
  );
  arch.castShadow = true;
  altar.add(arch);

  const innerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.9, 0.2, -0.2),
    new THREE.Vector3(-2.9, 3, -0.2),
    new THREE.Vector3(0, 5.3, -0.2),
    new THREE.Vector3(2.9, 3, -0.2),
    new THREE.Vector3(2.9, 0.2, -0.2),
  ]);
  const innerArch = new THREE.Mesh(
    new THREE.TubeGeometry(innerCurve, 32, 0.21, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xc0b9a4, roughness: 0.92 }),
  );
  altar.add(innerArch);

  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 1), wood);
  benchTop.position.set(0, 1.15, 0.25);
  altar.add(benchTop);
  [-1.45, 1.45].forEach((x) => {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.15, 0.7),
      wood,
    );
    pedestal.position.set(x, 0.58, 0.25);
    altar.add(pedestal);
  });

  const foliage = new THREE.MeshStandardMaterial({
    color: 0x2e6339,
    roughness: 0.9,
  });
  const flowers = [
    new THREE.MeshStandardMaterial({ color: 0xf2e5d0 }),
    new THREE.MeshStandardMaterial({ color: 0xb37b82 }),
  ];
  for (let i = 0; i < 28; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const cluster = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.23 + (i % 3) * 0.05, 1),
      i % 5 === 0 ? flowers[i % 2] : foliage,
    );
    cluster.position.set(
      side * (1.3 + (i % 7) * 0.42),
      0.5 + (i % 6) * 0.33,
      0.3 + (i % 3) * 0.1,
    );
    altar.add(cluster);
  }
  altar.position.set(0, 0, -12);
  scene.add(altar);

  const trunk = new THREE.MeshStandardMaterial({
    color: 0x735039,
    roughness: 1,
  });
  [-10, -7, 7, 10].forEach((x, i) =>
    addPalm(scene, x, -14 - (i % 2) * 3, 1 + (i % 2) * 0.18, trunk, foliage),
  );

  for (let i = 0; i < 40; i += 1) {
    const shrub = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 + (i % 4) * 0.16, 0),
      foliage,
    );
    const side = i % 2 === 0 ? -1 : 1;
    shrub.position.set(side * (8 + (i % 6) * 1.1), 0.55, 22 - i * 1.25);
    shrub.scale.y = 0.8 + (i % 3) * 0.25;
    scene.add(shrub);
  }

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 640 ? 58 : 48;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let frame = 0;
  const clock = new THREE.Clock();
  const render = () => {
    const progress = THREE.MathUtils.smoothstep(progressRef.current, 0, 1);
    camera.position.z = THREE.MathUtils.lerp(23, -4.2, progress);
    camera.position.y = THREE.MathUtils.lerp(3.9, 2.35, progress);
    camera.position.x = Math.sin(progress * Math.PI) * 0.28;
    camera.lookAt(0, THREE.MathUtils.lerp(2.15, 2.7, progress), -12);
    altar.position.y = Math.sin(clock.getElapsedTime() * 0.45) * 0.015;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  render();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
  };
}

export function WeddingExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const [opening, setOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const [traveling, setTraveling] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    return createGarden(canvasRef.current, progressRef);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressRef.current = progress;
      setTraveling(progress > 0.075);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openEnvelope = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpen(true), 820);
  };

  return (
    <main
      className={`experience${opening ? " is-opening" : ""}${open ? " is-open" : ""}`}
    >
      <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />
      <div className="garden-vignette" aria-hidden="true" />

      <section
        className={`invitation-copy${traveling ? " is-traveling" : ""}`}
        aria-label="Convite de casamento"
      >
        <p className="eyebrow">Com alegria, convidamos você e sua família</p>
        <h1>
          Djalma <span className="ampersand">&</span> Victoria
        </h1>
        <div className="invite-line" />
        <p className="invite-text">
          Para celebrar conosco o início de uma nova história, em uma tarde
          cercada de amor e natureza.
        </p>
        <div className="event-details">
          <div className="detail">
            <span>Quando</span>
            <strong>31 de outubro de 2026</strong>
          </div>
          <div className="detail">
            <span>Horário</span>
            <strong>16:20</strong>
          </div>
          <div className="detail">
            <span>Onde</span>
            <strong>Villa Garden</strong>
          </div>
        </div>
      </section>

      <p className={`scroll-cue${traveling ? " is-traveling" : ""}`}>
        Caminhe até o altar
      </p>

      <section className="envelope-stage" aria-label="Carta fechada">
        <div className="envelope-wrap">
          <div className="envelope-back" />
          <div className="envelope-flap" />
          <div className="envelope-front" />
          <div className="paper-grain" />
          <button
            className="seal-button"
            onClick={openEnvelope}
            aria-label="Abrir o convite de Djalma e Victoria"
            data-testid="open-invitation"
          >
            <span>D & V</span>
          </button>
          <p className="open-hint">Toque no lacre para abrir</p>
        </div>
      </section>
    </main>
  );
}
