// Loaded near the ember only. A single transparent quad; no photographic texture or scene engine.
const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2((aPosition.x + 1.0) * .5, (1.0 - aPosition.y) * .5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

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
float plume(vec2 p, float origin, float seed) {
  float rise = (335.0 - p.y) / 324.0;
  float gate = smoothstep(0.0, .018, rise) * (1.0 - smoothstep(.62, 1.0, rise));
  float bend = sin(rise * 6.0 - uTime * .45 + seed) * rise * (12.0 + rise * 18.0)
             + sin(rise * 12.0 + uTime * .32 + seed) * rise * 9.0;
  float center = origin - rise * 27.0 + bend;
  float width = 2.5 + max(rise, 0.0) * 48.0;
  float lateral = (p.x - center) / width;
  float envelope = exp(-lateral * lateral * 1.8) * gate;
  vec2 q = vec2(p.x * .034 + seed, p.y * .019 + uTime * .32);
  float warp = fbm(q + vec2(uTime * .04, 0.0));
  float billow = fbm(q + vec2(warp * 2.3, warp * .7));
  float filament = smoothstep(.29, .74, billow) * (.65 + .35 * noise(q * 3.0));
  float stem = (1.0 - smoothstep(.08,.26,rise)) * .20;
  return envelope * (filament + stem);
}
float fissure(vec2 p, vec2 a, vec2 b, float phase) {
  vec2 segment = b - a;
  float t = clamp(dot(p-a, segment) / dot(segment, segment), 0.0, 1.0);
  vec2 distance = p - a - segment*t;
  float pulse = .5 + .5*sin(uTime*.93 + phase);
  return exp(-dot(distance, distance)*2.8) * (.12 + .88*pulse*pulse*pulse);
}
void main() {
  vec2 p = vUv * vec2(480.0, 760.0);
  vec3 mask = texture2D(uMask, vUv).rgb;
  float edge = smoothstep(0.0, 14.0, p.x) * smoothstep(0.0, 14.0, 480.0-p.x)
             * smoothstep(0.0, 14.0, p.y) * smoothstep(0.0, 14.0, 760.0-p.y);
  vec4 outColor = vec4(0);

  // One fixed, narrow outlet on the top; turbulence grows only as the smoke rises.
  float smoke = plume(p, 235.0, 2.0);
  float inlet = 1.0 - smoothstep(0.0,24.0,335.0-p.y);
  float smokeAlpha = min(.22, smoke * .32) * max(1.0-mask.b,inlet);
  outColor = over(outColor, vec3(.19, .18, .17), smokeAlpha);

  // Each part of the real crack network has its own slow thermal wave and quick irregular flicker.
  float field = fbm(p * .04);
  float breath = .5 + .5 * sin(uTime * .85 + p.y * .018 + p.x * .02 + field * 3.0);
  float flicker = .5 + .5*sin(uTime*2.7 + field*13.0);
  float heat = smoothstep(.10, .91, breath * .75 + flicker * .25);
  float lowerRight = smoothstep(245.0,320.0,p.x) * smoothstep(450.0,580.0,p.y);
  float restraint = mix(1.0,.45,lowerRight);
  float cracks = smoothstep(.25,.70,mask.r);
  outColor = over(outColor, vec3(.88,.12,.008), mask.g * .008*heat*restraint);
  outColor = over(outColor, mix(vec3(.70,.045,.004),vec3(.95,.24,.018),heat), cracks*.12*heat*restraint);

  // Small discontinuous accents follow existing top/edge fissures; never outline the cube.
  float accent = fissure(p,vec2(203,353),vec2(217,349),.5);
  accent = max(accent,fissure(p,vec2(217,349),vec2(227,352),.5));
  accent = max(accent,fissure(p,vec2(227,352),vec2(235,345),.5));
  accent = max(accent,fissure(p,vec2(269,352),vec2(279,345),2.3));
  accent = max(accent,fissure(p,vec2(279,345),vec2(289,347),2.3));
  accent = max(accent,fissure(p,vec2(289,347),vec2(300,339),2.3));
  accent = max(accent,fissure(p,vec2(271,382),vec2(270,401),4.2));
  accent = max(accent,fissure(p,vec2(270,401),vec2(266,413),4.2));
  accent = max(accent,fissure(p,vec2(127,383),vec2(136,391),1.6));
  accent = max(accent,fissure(p,vec2(136,391),vec2(138,408),1.6));
  accent = max(accent,fissure(p,vec2(136,447),vec2(150,453),3.4));
  accent = max(accent,fissure(p,vec2(150,453),vec2(162,445),3.4));
  outColor = over(outColor,vec3(.88,.16,.012),accent*.16*mask.b);

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
  image.src = '/art/ember/mask.png';
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
