import { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sparkles, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────
// MATERIALS — Holographic Industrial Fusion
// Navy body with cyan/blue glows — IR meets sci-fi
// ─────────────────────────────────────────────────────────────
function useMats() {
  return useMemo(() => ({
    body:       new THREE.MeshStandardMaterial({ color:'#0e2a45', metalness:0.95, roughness:0.12 }),
    bodyMid:    new THREE.MeshStandardMaterial({ color:'#163554', metalness:0.90, roughness:0.16 }),
    bodyLight:  new THREE.MeshStandardMaterial({ color:'#1e4268', metalness:0.85, roughness:0.22 }),
    steelDark:  new THREE.MeshStandardMaterial({ color:'#0a1e2e', metalness:0.97, roughness:0.08 }),
    steel:      new THREE.MeshStandardMaterial({ color:'#2a4a60', metalness:0.95, roughness:0.12 }),
    steelLight: new THREE.MeshStandardMaterial({ color:'#3a6278', metalness:0.92, roughness:0.18 }),
    chrome:     new THREE.MeshStandardMaterial({ color:'#4a6e82', metalness:0.99, roughness:0.04 }),
    chromeDark: new THREE.MeshStandardMaterial({ color:'#253a48', metalness:0.99, roughness:0.03 }),
    // Glowing cyan — primary accent
    cyan:       new THREE.MeshStandardMaterial({ color:'#00d4ff', emissive:'#00d4ff', emissiveIntensity:1.4, metalness:0.5, roughness:0.2, transparent:true, opacity:0.92 }),
    cyanDim:    new THREE.MeshStandardMaterial({ color:'#00aacc', emissive:'#00aacc', emissiveIntensity:0.8, metalness:0.5, roughness:0.2 }),
    cyanRing:   new THREE.MeshStandardMaterial({ color:'#00d4ff', emissive:'#00d4ff', emissiveIntensity:1.8, transparent:true, opacity:0.85 }),
    // Blue accent
    blue:       new THREE.MeshStandardMaterial({ color:'#3b82f6', emissive:'#3b82f6', emissiveIntensity:1.0, transparent:true, opacity:0.88 }),
    // Brass
    brass:      new THREE.MeshStandardMaterial({ color:'#a07010', metalness:0.92, roughness:0.20 }),
    // Status lights
    green:      new THREE.MeshStandardMaterial({ color:'#00ee44', emissive:'#00ee44', emissiveIntensity:2.5 }),
    amber:      new THREE.MeshStandardMaterial({ color:'#ffaa00', emissive:'#ffaa00', emissiveIntensity:2.2 }),
    red:        new THREE.MeshStandardMaterial({ color:'#ff2222', emissive:'#ff2222', emissiveIntensity:2.0 }),
    // LCD
    lcd:        new THREE.MeshStandardMaterial({ color:'#000e10', emissive:'#00ffaa', emissiveIntensity:0.45 }),
    // Glass
    glass:      new THREE.MeshPhysicalMaterial({ color:'#88ccff', transparent:true, opacity:0.18, roughness:0, metalness:0 }),
    // Rubber
    rubber:     new THREE.MeshStandardMaterial({ color:'#080e14', metalness:0.02, roughness:0.97 }),
    // Holographic panel overlay
    holoBg:     new THREE.MeshStandardMaterial({ color:'#001828', emissive:'#003050', emissiveIntensity:0.30, transparent:true, opacity:0.55, side:THREE.DoubleSide }),
    // Oil green
    oilGreen:   new THREE.MeshStandardMaterial({ color:'#00ff66', emissive:'#00ff66', emissiveIntensity:1.0, transparent:true, opacity:0.88 }),
    // Pipe
    pipeAir:    new THREE.MeshStandardMaterial({ color:'#1a3a50', metalness:0.94, roughness:0.14 }),
    pipeOil:    new THREE.MeshStandardMaterial({ color:'#6a3a10', metalness:0.88, roughness:0.28 }),
  }), [])
}

// ─────────────────────────────────────────────────────────────
// STRAIGHT PIPE
// ─────────────────────────────────────────────────────────────
function HPipe({ x1,y1,z1, x2,y2,z2, r, mat }) {
  const a = new THREE.Vector3(x1,y1,z1)
  const b = new THREE.Vector3(x2,y2,z2)
  const dir = new THREE.Vector3().subVectors(b,a)
  const len = dir.length()
  const mid = new THREE.Vector3().addVectors(a,b).multiplyScalar(0.5)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize())
  return (
    <mesh position={mid} quaternion={q} material={mat} castShadow>
      <cylinderGeometry args={[r,r,len,12]}/>
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────
// HOLOGRAPHIC ORBIT RING (from reference design)
// ─────────────────────────────────────────────────────────────
function HoloRing({ radius, tilt, speed, color, thickness = 0.016, opacity = 0.85 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, thickness, 16, 140]}/>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4}
        transparent opacity={opacity}/>
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────
// ENERGY ORB — travels orbit path with glow
// ─────────────────────────────────────────────────────────────
function EnergyOrb({ radius, speed, color, offset = 0, tilt = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + offset
    if (ref.current) {
      const cosT = Math.cos(tilt)
      const sinT = Math.sin(tilt)
      const x = Math.cos(t) * radius
      const raw_y = Math.sin(t * 0.5) * 0.3
      const z = Math.sin(t) * radius
      ref.current.position.set(x, raw_y * cosT + z * sinT * 0.2, z * cosT - x * sinT * 0.1)
    }
  })
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.065, 14, 14]}/>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5}/>
      <pointLight color={color} intensity={1.2} distance={1.4} decay={2}/>
    </mesh>
  )
}

// Note: pointLight inside mesh won't work — use group instead
function EnergyOrbGroup({ radius, speed, color, offset = 0, tilt = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + offset
    if (ref.current) {
      const x = Math.cos(t) * radius
      const y = Math.sin(t * 0.6) * 0.25
      const z = Math.sin(t) * radius
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt)
      ref.current.position.set(x, y * cosT + z * sinT * 0.15, z * cosT - x * sinT * 0.1)
    }
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.065, 14, 14]}/>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5}/>
      </mesh>
      <pointLight color={color} intensity={1.4} distance={1.6} decay={2}/>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// DATA STREAM DOTS — vertical column of pulses
// ─────────────────────────────────────────────────────────────
function DataStream({ x, z, color }) {
  const ref = useRef()
  const count = 10
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i*3] = x; arr[i*3+1] = (i/count)*3.2 - 1.6; arr[i*3+2] = z
    }
    return arr
  }, [x, z])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.25 + Math.sin(clock.elapsedTime*2.5 + x)*0.30
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3}/>
      </bufferGeometry>
      <pointsMaterial size={0.055} color={color} transparent opacity={0.5} sizeAttenuation/>
    </points>
  )
}

// ─────────────────────────────────────────────────────────────
// BLINKING LED
// ─────────────────────────────────────────────────────────────
function LED({ pos, color, phase = 0 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = 0.6 + Math.sin(clock.elapsedTime*1.9+phase)*0.5
  })
  return (
    <group position={pos}>
      <mesh><sphereGeometry args={[0.018,10,10]}/>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5}/>
      </mesh>
      <pointLight ref={ref} color={color} intensity={0.6} distance={0.40}/>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// ANALOG GAUGE — with cyan arc glow
// ─────────────────────────────────────────────────────────────
function Gauge({ pos, rotY = 0, phase = 0 }) {
  const needleRef = useRef()
  const arcRef    = useRef()
  const m = useMats()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (needleRef.current) needleRef.current.rotation.z = -0.4 + Math.sin(t*0.5+phase)*0.5
    if (arcRef.current) arcRef.current.material.emissiveIntensity = 1.0 + Math.sin(t*1.2+phase)*0.5
  })
  return (
    <group position={pos} rotation={[Math.PI/2, 0, rotY]}>
      <mesh material={m.steelDark}><cylinderGeometry args={[0.10,0.10,0.046,24]}/></mesh>
      <mesh position={[0,0.024,0]}>
        <torusGeometry args={[0.094,0.007,8,24]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.2}/>
      </mesh>
      <mesh position={[0,0.026,0]} material={m.steelDark}><cylinderGeometry args={[0.086,0.086,0.006,24]}/></mesh>
      {/* Cyan arc readout */}
      <mesh ref={arcRef} position={[0,0.030,0]} rotation={[0,0,-0.8]}>
        <torusGeometry args={[0.068,0.008,8,32,Math.PI*1.6]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.0}/>
      </mesh>
      <group ref={needleRef} position={[0,0.034,0]}>
        <mesh position={[0.024,0,0]} rotation={[Math.PI/2,0,0]} material={m.red}>
          <boxGeometry args={[0.048,0.004,0.004]}/>
        </mesh>
      </group>
      <mesh position={[0,0.032,0]} material={m.glass}><cylinderGeometry args={[0.086,0.086,0.004,24]}/></mesh>
      <mesh position={[0,-0.055,0]} material={m.brass}><cylinderGeometry args={[0.014,0.014,0.066,8]}/></mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// SCREW ROTORS — chrome with cyan glow
// ─────────────────────────────────────────────────────────────
function ScrewRotors({ pos, spd }) {
  const mRef = useRef()
  const fRef = useRef()
  const m = useMats()
  useFrame(() => {
    if (mRef.current) mRef.current.rotation.y +=  0.022 * spd
    if (fRef.current) fRef.current.rotation.y -= (0.022 * spd * 4/6)
  })
  return (
    <group position={pos}>
      <group ref={mRef} position={[0.090,0,0]}>
        <mesh material={m.chromeDark}><cylinderGeometry args={[0.042,0.042,0.76,14]}/></mesh>
        {Array.from({length:4},(_,li)=>Array.from({length:8},(_,si)=>{
          const a=(li/4)*Math.PI*2+(si/8)*Math.PI*0.85
          return <mesh key={`m${li}${si}`}
            position={[Math.cos(a)*0.065,(si-3.5)*0.092,Math.sin(a)*0.065]}
            rotation={[0,-a,0]} material={m.chrome}>
            <boxGeometry args={[0.052,0.074,0.024]}/>
          </mesh>
        }))}
      </group>
      <group ref={fRef} position={[-0.090,0,0]}>
        <mesh material={m.chromeDark}><cylinderGeometry args={[0.036,0.036,0.76,14]}/></mesh>
        {Array.from({length:6},(_,li)=>Array.from({length:8},(_,si)=>{
          const a=(li/6)*Math.PI*2+(si/8)*Math.PI*0.70
          return <mesh key={`f${li}${si}`}
            position={[Math.cos(a)*0.052,(si-3.5)*0.092,Math.sin(a)*0.052]}
            rotation={[0,-a,0]} material={m.chrome}>
            <boxGeometry args={[0.042,0.074,0.019]}/>
          </mesh>
        }))}
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// MOTOR FAN
// ─────────────────────────────────────────────────────────────
function MotorFan({ spd }) {
  const ref = useRef()
  const m = useMats()
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.018 * spd })
  return (
    <group ref={ref} position={[-0.62, 0.570, 0]}>
      {Array.from({length:8},(_,i)=>{
        const a=(i/8)*Math.PI*2
        return <mesh key={i}
          position={[Math.cos(a)*0.30,0,Math.sin(a)*0.30]}
          rotation={[0.28,a,0.16]} material={m.steel} castShadow>
          <boxGeometry args={[0.28,0.009,0.10]}/>
        </mesh>
      })}
      <mesh material={m.steelDark}><cylinderGeometry args={[0.040,0.040,0.030,14]}/></mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPRESSOR ASSEMBLY — IR SH-250 with holographic theme
// ─────────────────────────────────────────────────────────────
function CompressorMesh({ hovered }) {
  const m    = useMats()
  const root = useRef()
  const g1   = useRef()
  const g2   = useRef()
  const spd  = hovered ? 2.8 : 1.0

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (root.current) root.current.rotation.y = Math.sin(t*0.10)*0.18 + Math.sin(t*0.055)*0.06
    if (g1.current) g1.current.intensity = 2.5 + Math.sin(t*1.5)*0.9
    if (g2.current) g2.current.intensity = 1.5 + Math.sin(t*1.1+1.2)*0.6
  })

  return (
    <group ref={root}>

      {/* ════ STEEL SKID ════ */}
      <mesh position={[0,-1.40,0]} material={m.steelDark} receiveShadow>
        <boxGeometry args={[2.30,0.09,1.12]}/>
      </mesh>
      {/* Cyan edge glow strips on skid */}
      {[-1.15,1.15].map((x,i)=>(
        <mesh key={i} position={[x,-1.36,0]}>
          <boxGeometry args={[0.006,0.055,1.14]}/>
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.0} transparent opacity={0.7}/>
        </mesh>
      ))}
      {/* I-beam rails */}
      {[-0.90,0.90].map(x=>(
        <group key={x}>
          <mesh position={[x,-1.34,0]} material={m.steel}><boxGeometry args={[0.065,0.055,1.14]}/></mesh>
          <mesh position={[x,-1.32,0]} material={m.steel}><boxGeometry args={[0.150,0.010,1.14]}/></mesh>
        </group>
      ))}
      {/* Cross-members */}
      {[-0.38,0,0.38].map((z,i)=>(
        <mesh key={i} position={[0,-1.350,z]} material={m.steelDark}><boxGeometry args={[2.32,0.007,0.060]}/></mesh>
      ))}
      {/* Anti-vibe pads */}
      {[[-0.86,-0.44],[0.86,-0.44],[-0.86,0.44],[0.86,0.44]].map(([x,z],i)=>(
        <group key={i} position={[x,-1.44,z]}>
          <mesh material={m.steel}><boxGeometry args={[0.12,0.040,0.12]}/></mesh>
          <mesh position={[0,-0.032,0]} material={m.rubber}><cylinderGeometry args={[0.040,0.040,0.030,10]}/></mesh>
        </group>
      ))}

      {/* ════ ELECTRIC MOTOR — left cylinder ════ */}
      <mesh position={[-0.62,-0.28,0]} material={m.body} castShadow>
        <cylinderGeometry args={[0.42,0.42,1.52,36]}/>
      </mesh>
      {/* Holographic highlight band */}
      <mesh position={[-0.62,-0.28,0]}>
        <cylinderGeometry args={[0.425,0.425,1.50,36]}/>
        <meshStandardMaterial color="#00aaff" transparent opacity={0.06} emissive="#00aaff" emissiveIntensity={0.5} side={THREE.BackSide}/>
      </mesh>
      <mesh position={[-0.62, 0.47,0]} material={m.steelDark}><cylinderGeometry args={[0.430,0.430,0.055,32]}/></mesh>
      <mesh position={[-0.62,-1.03,0]} material={m.steelDark}><cylinderGeometry args={[0.430,0.430,0.055,32]}/></mesh>
      <mesh position={[-0.62,-0.99,0]} material={m.bodyMid}><cylinderGeometry args={[0.410,0.410,0.040,32]}/></mesh>
      {/* Toroidal cooling fins with cyan glow every 5th */}
      {Array.from({length:15},(_,i)=>(
        <mesh key={i} position={[-0.62,-0.65+i*0.074,0]}>
          <torusGeometry args={[0.425,0.015,8,36]}/>
          <meshStandardMaterial
            color={i%5===0 ? "#00d4ff" : "#1e3d58"}
            emissive={i%5===0 ? "#00d4ff" : "#0a1e30"}
            emissiveIntensity={i%5===0 ? 0.8 : 0.15}
            metalness={0.90} roughness={0.18}/>
        </mesh>
      ))}
      {/* Glowing cyan rings at motor thirds — signature look */}
      {[-0.72,0,0.72].map((y,i)=>(
        <mesh key={i} position={[-0.62,-0.28+y,0]}>
          <torusGeometry args={[0.428,0.022,12,36]}/>
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.1} transparent opacity={0.88}/>
        </mesh>
      ))}
      {/* Terminal box */}
      <mesh position={[-0.62,0.06,0.432]} material={m.steelDark}><boxGeometry args={[0.28,0.20,0.048]}/></mesh>
      <mesh position={[-0.62,0.06,0.450]}>
        <boxGeometry args={[0.22,0.14,0.006]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.30} transparent opacity={0.55}/>
      </mesh>
      {/* Nameplate */}
      <mesh position={[-0.62,-0.22,0.426]} material={m.steel}><boxGeometry args={[0.34,0.12,0.007]}/></mesh>
      <mesh position={[-0.62,-0.22,0.431]}>
        <boxGeometry args={[0.28,0.016,0.004]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.2}/>
      </mesh>
      {/* Fan cowl */}
      <mesh position={[-0.62,0.558,0]} material={m.steelDark}><cylinderGeometry args={[0.455,0.455,0.070,28]}/></mesh>
      {/* Fan guard — cyan rings */}
      {[0.40,0.30,0.20,0.11].map((r2,i)=>(
        <mesh key={i} position={[-0.62,0.576,0]}>
          <torusGeometry args={[r2,0.005,8,32]}/>
          <meshStandardMaterial color={i===0?"#00d4ff":"#1a3a50"} emissive={i===0?"#00d4ff":"#0a1e30"} emissiveIntensity={i===0?1.0:0.2}/>
        </mesh>
      ))}
      {Array.from({length:8},(_,i)=>(
        <mesh key={i} position={[-0.62,0.576,0]} rotation={[0,(i/8)*Math.PI*2,0]} material={m.steelDark}>
          <boxGeometry args={[0.82,0.004,0.004]}/>
        </mesh>
      ))}
      <MotorFan spd={spd}/>

      {/* ════ COUPLING GUARD ════ */}
      <mesh position={[-0.10,-0.28,0]} material={m.steelDark}><cylinderGeometry args={[0.200,0.200,0.62,24]}/></mesh>
      <mesh position={[-0.10,-0.28,0.202]}>
        <boxGeometry args={[0.004,0.62,0.004]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.7}/>
      </mesh>

      {/* ════ COMPRESSOR BLOCK — right box ════ */}
      <mesh position={[0.52,-0.26,0]} material={m.body} castShadow><boxGeometry args={[0.90,1.42,0.82]}/></mesh>
      {/* Holographic inner glow */}
      <mesh position={[0.52,-0.26,0]}>
        <boxGeometry args={[0.92,1.44,0.84]}/>
        <meshStandardMaterial color="#00aaff" transparent opacity={0.04} emissive="#00aaff" emissiveIntensity={0.5} side={THREE.BackSide}/>
      </mesh>
      <mesh position={[0.52,-0.26, 0.414]} material={m.bodyLight}><boxGeometry args={[0.92,1.44,0.024]}/></mesh>
      <mesh position={[0.52,-0.26,-0.414]} material={m.bodyLight}><boxGeometry args={[0.92,1.44,0.024]}/></mesh>
      {/* Structural ribs with cyan glow on alternate */}
      {[-0.28,0.10,0.48].map((y,i)=>(
        <mesh key={i} position={[0.52,y,0]}>
          <boxGeometry args={[0.92,0.012,0.86]}/>
          <meshStandardMaterial color={i===1?"#00d4ff":"#0a1e2e"} emissive={i===1?"#00d4ff":"#050e18"} emissiveIntensity={i===1?0.6:0.1} metalness={0.96} roughness={0.08}/>
        </mesh>
      ))}
      {/* 4 corner bolts flush */}
      {[[-0.34,0.60],[0.34,0.60],[-0.34,-0.56],[0.34,-0.56]].map(([bx,by],i)=>(
        <mesh key={i} position={[0.13+bx,by,0.426]} material={m.brass}>
          <cylinderGeometry args={[0.018,0.018,0.015,6]}/>
        </mesh>
      ))}
      {/* Rotor window */}
      <mesh position={[0.52,-0.26,0.416]}>
        <boxGeometry args={[0.26,0.34,0.003]}/>
        <meshPhysicalMaterial color="#001018" transparent opacity={0.88} roughness={0.0}/>
      </mesh>
      <ScrewRotors pos={[0.52,-0.26,0]} spd={spd}/>

      {/* ════ INLET FILTER ════ */}
      <mesh position={[0.52,0.72,0]} material={m.bodyLight} castShadow><cylinderGeometry args={[0.200,0.200,0.44,22]}/></mesh>
      {Array.from({length:6},(_,i)=>{
        const a=(i/6)*Math.PI*2
        return <mesh key={i} position={[0.52+Math.cos(a)*0.202,0.72,Math.sin(a)*0.202]} rotation={[0,a,0]} material={m.bodyMid}>
          <boxGeometry args={[0.026,0.44,0.026]}/>
        </mesh>
      })}
      <mesh position={[0.52,0.942,0]} material={m.steelDark}><cylinderGeometry args={[0.210,0.210,0.032,22]}/></mesh>
      <mesh position={[0.52,0.945,0]}>
        <torusGeometry args={[0.205,0.007,8,22]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.0}/>
      </mesh>
      <mesh position={[0.52,0.960,0]} material={m.steelDark}><cylinderGeometry args={[0.055,0.055,0.040,14]}/></mesh>

      {/* ════ OIL SEPARATOR VESSEL ════ */}
      <mesh position={[-0.62,0.94,0]} material={m.body} castShadow><cylinderGeometry args={[0.262,0.262,0.62,26]}/></mesh>
      {/* Cyan rings on separator */}
      {[0.62,0.94,1.20].map((y,i)=>(
        <mesh key={i} position={[-0.62,y,0]}>
          <torusGeometry args={[0.268,i===1?0.020:0.012,8,26]}/>
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={i===1?1.4:0.8} transparent opacity={0.85}/>
        </mesh>
      ))}
      <mesh position={[-0.62,1.25,0]} material={m.bodyMid}>
        <sphereGeometry args={[0.262,18,18,0,Math.PI*2,0,Math.PI/2]}/>
      </mesh>
      <mesh position={[-0.62,0.612,0]} material={m.steelDark}><cylinderGeometry args={[0.270,0.270,0.020,26]}/></mesh>
      {/* Pressure relief */}
      <mesh position={[-0.62,1.328,0.10]} material={m.brass}><cylinderGeometry args={[0.026,0.026,0.072,10]}/></mesh>
      <mesh position={[-0.62,1.366,0.10]} material={m.red}><cylinderGeometry args={[0.036,0.028,0.032,10]}/></mesh>
      {/* Sight glass */}
      <mesh position={[-0.350,0.94,0]} material={m.steelDark}><boxGeometry args={[0.015,0.28,0.030]}/></mesh>
      <mesh position={[-0.341,0.94,0]} material={m.glass}><boxGeometry args={[0.006,0.24,0.020]}/></mesh>
      <mesh position={[-0.340,0.89,0]}>
        <boxGeometry args={[0.004,0.14,0.014]}/>
        <meshStandardMaterial color="#00ff66" emissive="#00ff66" emissiveIntensity={1.0} transparent opacity={0.90}/>
      </mesh>
      <pointLight position={[-0.340,0.89,0.06]} color="#00ff66" intensity={0.30} distance={0.50}/>

      {/* ════ AFTERCOOLER ════ */}
      <mesh position={[0.52,-1.01,0]} material={m.bodyMid}><boxGeometry args={[0.82,0.26,0.74]}/></mesh>
      {Array.from({length:13},(_,i)=>(
        <mesh key={i} position={[0.04+i*0.058,-1.01,0]}>
          <boxGeometry args={[0.011,0.24,0.68]}/>
          <meshStandardMaterial color={i%4===0?"#00aacc":"#0a1e2e"} emissive={i%4===0?"#00aacc":"#040c12"} emissiveIntensity={i%4===0?0.5:0.08} metalness={0.96} roughness={0.08}/>
        </mesh>
      ))}
      <mesh position={[0.04,-1.01,0]} material={m.steel}><boxGeometry args={[0.014,0.26,0.74]}/></mesh>
      <mesh position={[0.98,-1.01,0]} material={m.steel}><boxGeometry args={[0.014,0.26,0.74]}/></mesh>

      {/* ════ PIPING ════ */}
      <HPipe x1={0.52} y1={0.44} z1={0.41} x2={0.52} y2={0.72} z2={0.41} r={0.043} mat={m.pipeAir}/>
      <HPipe x1={0.52} y1={0.72} z1={0.41} x2={-0.22} y2={0.72} z2={0.41} r={0.043} mat={m.pipeAir}/>
      <HPipe x1={-0.22} y1={0.72} z1={0.41} x2={-0.22} y2={0.62} z2={0.41} r={0.043} mat={m.pipeAir}/>
      <HPipe x1={0.20} y1={0.30} z1={0.415} x2={0.20} y2={-0.52} z2={0.415} r={0.024} mat={m.pipeOil}/>
      <HPipe x1={0.20} y1={-0.52} z1={0.415} x2={0.52} y2={-0.52} z2={0.415} r={0.024} mat={m.pipeOil}/>
      <HPipe x1={0.52} y1={-0.76} z1={0.41} x2={0.88} y2={-0.76} z2={0.41} r={0.022} mat={m.pipeAir}/>
      <mesh position={[0.90,-0.76,0.41]} material={m.brass}><cylinderGeometry args={[0.034,0.028,0.078,10]}/></mesh>
      <mesh position={[0.90,-0.718,0.41]} material={m.red}><cylinderGeometry args={[0.042,0.042,0.018,10]}/></mesh>

      {/* ════ CONTROL PANEL ════ */}
      <mesh position={[0.52,0.18,0.412]} material={m.steelDark}><boxGeometry args={[0.54,0.38,0.036]}/></mesh>
      {/* Holographic cyan panel border glow */}
      <mesh position={[0.52,0.18,0.422]}>
        <boxGeometry args={[0.52,0.36,0.004]}/>
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.80} transparent opacity={0.40}/>
      </mesh>
      <mesh position={[0.52,0.18,0.426]} material={m.steelDark}><boxGeometry args={[0.48,0.32,0.004]}/></mesh>
      <mesh position={[0.52,0.08,0.430]} material={m.lcd}><boxGeometry args={[0.28,0.095,0.003]}/></mesh>
      <pointLight position={[0.52,0.08,0.52]} color="#00ffaa" intensity={0.35} distance={0.60}/>
      <LED pos={[0.640,0.245,0.432]} color="#00cc44" phase={0.0}/>
      <LED pos={[0.520,0.245,0.432]} color="#ffaa00" phase={1.4}/>
      <LED pos={[0.400,0.245,0.432]} color="#ff2222" phase={2.8}/>
      <mesh position={[0.620,0.058,0.432]} material={m.green}><cylinderGeometry args={[0.022,0.022,0.012,12]}/></mesh>
      <mesh position={[0.420,0.058,0.432]} material={m.red}><cylinderGeometry args={[0.022,0.022,0.012,12]}/></mesh>
      <mesh position={[0.520,0.058,0.432]} material={m.steelLight}><cylinderGeometry args={[0.025,0.025,0.014,16]}/></mesh>

      {/* ════ PRESSURE GAUGES ════ */}
      <Gauge pos={[0.880,0.40,0.41]} rotY={0}          phase={0.0}/>
      <Gauge pos={[0.140,0.40,0.41]} rotY={0}          phase={1.2}/>
      <Gauge pos={[-0.62,1.31,0.26]} rotY={Math.PI/2}  phase={2.4}/>

      {/* ════ DATA STREAMS — vertical dot columns ════ */}
      <DataStream x={-1.15} z={0.42} color="#00d4ff"/>
      <DataStream x={ 1.15} z={0.42} color="#3b82f6"/>
      <DataStream x={-1.15} z={-0.42} color="#00aacc"/>

      {/* ════ DYNAMIC LIGHTS ════ */}
      <pointLight ref={g1} position={[0.52,-0.26,1.2]} color="#00c8ff" intensity={2.5} distance={3.8}/>
      <pointLight ref={g2} position={[-0.62,0.94,1.0]} color="#00aaff" intensity={1.5} distance={3.0}/>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────
// SCENE
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SCENE — mobile-aware lighting
// ─────────────────────────────────────────────────────────────
function Scene({ hovered, isMobile }) {
  const groupRef = useRef()
  useFrame(({ clock }) => {
    if (groupRef.current)
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.45) * 0.06
  })

  // Mobile gets boosted light values
  const m = isMobile ? 2.2 : 1.0

  return (
    <>
      <ambientLight intensity={1.8 * m} color="#c8e0ff"/>
      <directionalLight position={[6,10,6]} intensity={4.5 * m} castShadow color="#ffffff"
        shadow-mapSize={[isMobile ? 512 : 2048, isMobile ? 512 : 2048]}
        shadow-camera-near={0.5} shadow-camera-far={24}
        shadow-camera-left={-5} shadow-camera-right={5}
        shadow-camera-top={5} shadow-camera-bottom={-5}/>
      <directionalLight position={[-5,4,-3]} intensity={1.8 * m} color="#4488ff"/>
      <directionalLight position={[2,-3,4]}  intensity={1.2 * m} color="#00aaff"/>
      <pointLight position={[0,0.5,5.5]} intensity={6.0 * m} color="#ffffff" distance={14} decay={2}/>
      <pointLight position={[3,3,4]}    intensity={6.5 * m} color="#00d4ff" distance={12} decay={2}/>
      <pointLight position={[-4,-2,3]}  intensity={3.0 * m} color="#3b82f6" distance={9}  decay={2}/>
      <pointLight position={[0,6,0]}    intensity={2.0 * m} color="#aaddff" distance={10} decay={2}/>
      <spotLight position={[0,8,3]} angle={0.45} intensity={5.0 * m}
        castShadow penumbra={0.6} color="#ffffff" distance={16}/>

      <mesh position={[0,-1.58,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[18,18]}/><shadowMaterial transparent opacity={0.28}/>
      </mesh>

      <group ref={groupRef}>
        <CompressorMesh hovered={hovered}/>
        <HoloRing radius={1.90} tilt={0}            speed={ 0.50} color="#00d4ff" thickness={0.020}/>
        <HoloRing radius={2.20} tilt={Math.PI/2.8}  speed={-0.35} color="#3b82f6" thickness={0.014}/>
        <HoloRing radius={2.55} tilt={Math.PI/4}    speed={ 0.25} color="#00d4ff" thickness={0.009}/>
        <HoloRing radius={2.90} tilt={Math.PI/1.8}  speed={-0.18} color="#60a5fa" thickness={0.006} opacity={0.60}/>
        <EnergyOrbGroup radius={1.90} speed={ 1.2} color="#00ffcc" offset={0}          tilt={0}/>
        <EnergyOrbGroup radius={1.90} speed={ 1.2} color="#00d4ff" offset={Math.PI}    tilt={0}/>
        <EnergyOrbGroup radius={2.20} speed={-0.9} color="#3b82f6" offset={Math.PI/3}  tilt={Math.PI/2.8}/>
        <EnergyOrbGroup radius={2.55} speed={ 0.7} color="#00d4ff" offset={Math.PI*0.7} tilt={Math.PI/4}/>
      </group>

      <mesh rotation={[0.4,0.6,0.15]}>
        <icosahedronGeometry args={[3.6,1]}/>
        <meshStandardMaterial color="#00d4ff" wireframe transparent opacity={0.030}/>
      </mesh>

      {/* Fewer sparkles on mobile for performance */}
      <Sparkles count={isMobile ? 30 : 60} scale={7} size={1.8} speed={0.20} color="#00d4ff" opacity={0.45}/>
      <Sparkles count={isMobile ? 15 : 30} scale={5} size={2.5} speed={0.14} color="#3b82f6" opacity={0.35}/>

      <ContactShadows position={[0,-1.60,0]} opacity={0.35} scale={9} blur={2.8} far={3.5}/>

      <OrbitControls enablePan={true}
        target={[0.0, 0.0, 0]}
        minDistance={3.0} maxDistance={12.0}
        minPolarAngle={Math.PI*0.08} maxPolarAngle={Math.PI*0.80}
        dampingFactor={0.06} enableDamping autoRotate={false}/>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
export default function CompressorScene({ height = '100%' }) {
  const [hovered, setHovered] = useState(false)
  // Detect mobile — window width < 1024px OR touch device
  const isMobile = typeof window !== 'undefined'
    && (window.innerWidth < 1024 || 'ontouchstart' in window)

  // Mobile: higher exposure + no shadows for brightness
  const exposure = isMobile ? 2.8 : 1.65

  return (
    <div style={{width:'100%', height}}
      className="cursor-grab active:cursor-grabbing"
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}>
      <Canvas
        shadows={!isMobile}
        camera={{position:[0.0, 0.0, 10.5], fov:42}}
        gl={{
          antialias: !isMobile,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
          powerPreference: 'high-performance',
          alpha: true
        }}
        style={{width:'100%',height:'100%',background:'transparent'}}>
        <Suspense fallback={null}>
          <Scene hovered={hovered} isMobile={isMobile}/>
        </Suspense>
      </Canvas>
    </div>
  )
}
