import { OPTIMIZED_LAPTOP } from './model.generated.js'

export const RESUME_ASSET = {
  url: '/assets/sangamcv.pdf',
  downloadName: 'Sangam-Sitapuri-Resume.pdf',
  sourcePath: 'SangamCV.pdf',
  sourceUrl: 'https://github.com/SangamSitapuri07/sangam-portfolio/blob/main/SangamCV.pdf',
  sourceSha: '18c1d46c5d597ef983dd43113a792e867a169373',
  bytes: 128156,
}

export const LAPTOP_ASSET = {
  url: OPTIMIZED_LAPTOP.url,
  originalUrl: '/models/cyberpunk_laptop.glb',
  poster: '/images/laptop-studio.png',
  sourceSha: '42d690d45aa1beacd845759aca38442e21bce93f',
  bytes: OPTIMIZED_LAPTOP.bytes,
  sourceBytes: 8326028,
  optimizedSha: OPTIMIZED_LAPTOP.sha,
  compression: OPTIMIZED_LAPTOP.compression,
  nodes: {
    base: 'Cube_0',
    lid: 'Cube.001_3',
    mainScreen: 'Object_24',
    secondaryScreen: 'Object_25',
  },
  hinge: {
    axis: 'x',
    position: [0, 0.09567784518003464, -0.72751384973526],
  },
  attribution: {
    title: 'CyberPunk Laptop',
    author: 'Vivien Deroche',
    authorUrl: 'https://sketchfab.com/blue-odym',
    sourceUrl: 'https://sketchfab.com/3d-models/cyberpunk-laptop-8330c89e8431451db3aa9d15c5836ddf',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
}
