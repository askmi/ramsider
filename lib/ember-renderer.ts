import fissurePaths from './ember-fissures.json';

// Loaded near the ember only. A single transparent quad; no photographic texture or scene engine.
const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2((aPosition.x + 1.0) * .5, (1.0 - aPosition.y) * .5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// Build one bounded shader block per mapped fissure; arc distance remains continuous
// across its segments, so a highlight travels rather than each segment blinking in place.
const fissureSource = fissurePaths.map(({ points, phase }) => {
  const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let offset = 0;
  const segments = lengths.map((length, i) => {
    const a = points[i], b = points[i + 1];
    const expression = `accent = max(accent, fissure(p, vec2(${a[0]}.0,${a[1]}.0), vec2(${b[0]}.0,${b[1]}.0), ${offset.toFixed(4)}, ${total.toFixed(4)}, ${phase.toFixed(4)}));`;
    offset += length;
    return expression;
  });
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  return `if (p.x > ${(Math.min(...xs) - 6).toFixed(1)} && p.x < ${(Math.max(...xs) + 6).toFixed(1)} && p.y > ${(Math.min(...ys) - 6).toFixed(1)} && p.y < ${(Math.max(...ys) + 6).toFixed(1)}) { ${segments.join('\n')} }`;
}).join('\n');

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uMask;
uniform float uTime;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), u.x), u.y);
}
float fbm(vec2 p) {
  float f = 0.0;
  f += .55 * noise(p); p = mat2(1.6, -1.2, 1.2, 1.6) * p + 2.3;
  f += .27 * noise(p); p = mat2(1.6, -1.2, 1.2, 1.6) * p + 2.3;
  f += .13 * noise(p);
  return f;
}
vec4 over(vec4 base, vec3 color, float alpha) {
  alpha = clamp(alpha, 0.0, 1.0);
  return vec4(color * alpha + base.rgb * (1.0 - alpha), alpha + base.a * (1.0 - alpha));
}
float fissure(vec2 p, vec2 a, vec2 b, float offset, float total, float phase) {
  vec2 segment = b - a;
  float t = clamp(dot(p-a, segment) / dot(segment, segment), 0.0, 1.0);
  vec2 distance = p - a - segment*t;
  float along = offset + t*length(segment);
  float wave = max(0.0, sin(along*.10 - uTime*1.7 + phase));
  float packet = wave*wave*wave;
  float flicker = .72 + .28*sin(uTime*3.7 + phase)*sin(uTime*3.7 + phase);
  float ends = smoothstep(0.0,3.0,along) * smoothstep(0.0,3.0,total-along);
  float d2 = dot(distance,distance);
  return (.82*exp(-d2/.9) + .055*exp(-d2/6.0))*packet*flicker*ends;
}
void main() {
  vec2 p = vUv * vec2(480.0, 760.0);
  vec3 mask = texture2D(uMask, vUv).rgb;
  float edge = smoothstep(0.0, 14.0, p.x) * smoothstep(0.0, 14.0, 480.0-p.x)
             * smoothstep(0.0, 14.0, p.y) * smoothstep(0.0, 14.0, 760.0-p.y);
  vec4 outColor = vec4(0);

  // Each part of the real crack network has its own slow thermal wave and quick irregular flicker.
  float field = fbm(p * .04);
  float breath = .5 + .5 * sin(uTime * .85 + p.y * .018 + p.x * .02 + field * 3.0);
  float flicker = .5 + .5*sin(uTime*2.7 + field*13.0);
  float heat = smoothstep(.10, .91, breath * .75 + flicker * .25);
  float lowerRight = smoothstep(245.0,320.0,p.x) * smoothstep(450.0,580.0,p.y);
  float restraint = mix(1.0,.85,lowerRight);
  float cracks = smoothstep(.25,.70,mask.r);
  outColor = over(outColor, vec3(.88,.12,.008), mask.g * .008*heat*restraint);
  // The photo already contains bright embers. Cooling and rekindling that baked light
  // makes the cracks breathe without covering the black facets with orange bloom.
  outColor = over(outColor, vec3(.12,.012,.002), cracks*.65*(1.0-heat)*restraint);
  outColor = over(outColor, vec3(1.0,.26,.012), cracks*.20*heat*restraint);

  // Local traveling glints trace real dark fissures on all three visible faces.
  float accent = 0.0;
  ${fissureSource}
  outColor = over(outColor,vec3(1.0,.42,.055),accent*mask.b);

  // Reflection is intentionally subdued and spatially bounded to the pedestal below the coal.
  vec2 reflection = (p - vec2(297.0, 665.0)) / vec2(65.0, 14.0);
  float reflected = exp(-dot(reflection, reflection)*1.8) * (.010 + .008*sin(uTime*1.1));
  outColor = over(outColor, vec3(.95,.28,.025), reflected);

  // Sparse rising embers, with individual lifetimes, a tiny trailing glow and no hard loop boundary.
  for (int i = 0; i < 9; i++) {
    float seed = float(i) * 17.17 + 1.0;
    float h = hash(vec2(seed, 4.1));
    float age = fract(uTime * (.055 + h*.024) + h);
    float life = smoothstep(.0,.06,age) * (1.0-smoothstep(.55,.94,age));
    float sx = 160.0 + hash(vec2(seed,3.2))*202.0;
    float sy = 340.0 + hash(vec2(seed,6.8))*22.0;
    vec2 position = vec2(sx + sin(age*8.0+seed)*age*25.0-age*18.0, sy-age*(170.0+h*140.0));
    vec2 d = p-position;
    float spark = exp(-dot(d/vec2(1.1,1.8),d/vec2(1.1,1.8))*2.0);
    float tail = exp(-dot((d-vec2(0,2.8))/vec2(1.5,5.2),(d-vec2(0,2.8))/vec2(1.5,5.2))*2.0)*.22;
    outColor = over(outColor, vec3(1.0,.48,.08), (spark+tail)*life*.9*(1.0-mask.b));
  }
  gl_FragColor = outColor * edge;
}`;

export interface EmberRenderer {
  setRunning(running: boolean): void;
  destroy(): void;
}

export async function createEmberRenderer(canvas: HTMLCanvasElement): Promise<EmberRenderer> {
  const image = new Image();
  image.decoding = 'async';
  image.src = '/art/ember/mask.webp';
  await image.decode();
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('Ember WebGL unavailable');
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  let frame = 0, running = false, destroyed = false, lost = false, time = 13.7, previous = 0;
  const cleanup = () => {
    gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    if (!program || !buffer || !texture) throw new Error('Ember resources unavailable');
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Ember shader unavailable');
      shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Ember shader compilation failed');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Ember shader link failed');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, 'uMask'), 0);
  } catch (error) { cleanup(); throw error; }

  const timeUniform = gl.getUniformLocation(program!, 'uTime');
  const draw = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2, 600 / Math.max(canvas.clientWidth, 1))));
    const height = Math.round(width * 760 / 480);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height);
    gl.uniform1f(timeUniform, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.dataset.time = time.toFixed(3);
  };
  const tick = (now: number) => {
    if (!running || destroyed || lost) return;
    time += previous ? Math.min((now-previous)/1000, .05) : 0;
    previous = now;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const resize = new ResizeObserver(() => { if (!destroyed && !lost) draw(); });
  resize.observe(canvas);
  const contextLost = () => {
    lost = true; running = false; cancelAnimationFrame(frame);
    canvas.dataset.state = 'fallback';
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  draw(); canvas.dataset.state = 'paused';
  return {
    setRunning(next) {
      if (destroyed || lost || next === running) return;
      running = next; previous = 0; cancelAnimationFrame(frame);
      canvas.dataset.state = next ? 'running' : 'paused';
      if (next) frame = requestAnimationFrame(tick);
    },
    destroy() {
      destroyed = true; running = false; cancelAnimationFrame(frame); resize.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      cleanup();
    },
  };
}
