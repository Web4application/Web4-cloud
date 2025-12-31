import {
  createWorld,
  query,
  addEntity,
  removeEntity,
  addComponent,
} from 'bitecs'

// Put components wherever you want
const Health = [] as number[]

const world = createWorld({
  components: {
    // They can be any shape you want
    // SoA:
    Position: { x: [], y: [] },
    Velocity: { x: new Float32Array(1e5), y: new Float32Array(1e5) },
    // AoS:
    Player: [] as { level: number; experience: number; name: string }[]
  },
  time: {
    delta: 0, 
    elapsed: 0, 
    then: performance.now()
  }
})

const { Position, Velocity, Player } = world.components

const eid = addEntity(world)
addComponent(world, eid, Position)
addComponent(world, eid, Velocity)
addComponent(world, eid, Player)
addComponent(world, eid, Health)

// SoA access pattern
Position.x[eid] = 0
Position.y[eid] = 0
Velocity.x[eid] = 1.23
Velocity.y[eid] = 1.23
Health[eid] = 100

// AoS access pattern  
Player[eid] = { level: 1, experience: 0, name: "Hero" }

const movementSystem = (world) => {
  const { Position, Velocity } = world.components
  
  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid] * world.time.delta
    Position.y[eid] += Velocity.y[eid] * world.time.delta
  }
}

const experienceSystem = (world) => {
  const { Player } = world.components
  
  for (const eid of query(world, [Player])) {
    Player[eid].experience += world.time.delta / 1000
    if (Player[eid].experience >= 100) {
      Player[eid].level++
      Player[eid].experience = 0
    }
  }
}

const healthSystem = (world) => {
  for (const eid of query(world, [Health])) {
    if (Health[eid] <= 0) removeEntity(world, eid)
  }
}

const timeSystem = (world) => {
  const { time } = world
  const now = performance.now()
  const delta = now - time.then
  time.delta = delta
  time.elapsed += delta
  time.then = now
}

const update = (world) => {
  timeSystem(world)
  movementSystem(world)
  experienceSystem(world)
  healthSystem(world)
}

// Node environment
setInterval(() => {
  update(world)
}, 1000/60)

// Browser environment
requestAnimationFrame(function animate() {
  update(world)
  requestAnimationFrame(animate)
})
