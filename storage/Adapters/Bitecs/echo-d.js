import {
    Types,
    defineComponent,
    setDefaultSize,
} from 'bitecs'

import {
    BitECSStorage,
} from '../lib/extra/storage/bitecs.js'

setDefaultSize(1000)

export const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 }

export const Position = defineComponent(Vector3)

// ...

const echoD = new EchoD({}, {
    types: {
        position: ['f32', 3, Position, Vector3, 10], // 10 vec3 per block
    },
}, null, BitECSStorage);

const world = echoD.store.world;
