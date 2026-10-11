const BOUNDARY = `
vec2 bound(vec2 p) {
  vec2 d = p - .5; float r = length(d);
  return .5 + d * min(1.0, .485 / max(r, .0001));
}
float inside(vec2 p) { return step(length(p - .5), .487); }
`;
export const SEED = `
uniform sampler2D photograph;
uniform vec4 crop;
void main() { fragColor = vec4(texture(photograph, crop.xy + uv * crop.zw).rgb, 0.0); }
`;
export const COPY = `uniform sampler2D source; void main() { fragColor = texture(source, uv); }`;
// Recipe assembly has no photographic latte seed. The photograph supplies the
// ceramic around the clipped liquid only; all visible material lives in the GPU.
export const DRINK_SEED = `
uniform vec3 baseColor;
void main() {
  float r=length(uv-.5);
  float bowl=1.0-.18*smoothstep(.25,.51,r);
  float glow=exp(-dot(uv-vec2(.33,.72),uv-vec2(.33,.72))/.15)*.025;
  fragColor=vec4(baseColor*bowl+glow,0.0);
}`;
export const MATERIAL_REFERENCE = `
uniform vec3 baseColor;
void main() { fragColor=vec4(baseColor,1.0); }
`;
export const POUR = `
uniform sampler2D source, currentMean;
uniform vec3 ingredientColor;
uniform vec2 centre;
uniform float radius, strength, phase, sugar, viscosity, entrainment;
void main() {
  vec4 current=texture(source,uv);
  vec2 d=uv-centre;
  float theta=atan(d.y,d.x);
  // Milk lays down a narrow soft fold. It is carried by the fluid, rather
  // than painted as an expanding, many-pointed splash at the nozzle.
  vec2 fold=d;
  fold.x+=sin(d.y/max(radius,.001)*3.2+phase*.45)*radius*.18*viscosity;
  fold*=mix(vec2(1.0),vec2(.88,1.18),viscosity);
  fold.x+=sin(d.y/max(radius,.001)*2.1+phase*.6)*radius*.32*entrainment;
  float shape=1.0+.06*sin(theta*3.0+phase*.40);
  float distance=length(fold)*shape;
  float plume=exp(-distance*distance/(radius*radius*.52));
  // Fine branching tongues enter the pigment field and travel with the flow;
  // these are actual transported additions, not a stationary surface overlay.
  float fingers=pow(.5+.5*sin(theta*3.0-distance/radius*3.0+phase*.30),4.0);
  float skirtDistance=(distance-radius*.90)/(radius*.50);
  float skirt=exp(-skirtDistance*skirtDistance)*fingers;
  float mask=1.0-smoothstep(.44,.48,length(uv-.5));
  float amount=clamp((plume+mix(.16,.34,entrainment)*skirt)*strength*mask,0.0,.30);
  // Thin milk enters the coffee beneath its surface: the emerging folds carry
  // existing coffee colour, rather than accumulating opaque white paint.
  vec4 meanSample=texture(currentMean,vec2(.5));
  vec3 coffeeBody=meanSample.rgb/max(meanSample.a,.001);
  float foldedMilk=.34+.16*smoothstep(.25,.95,distance/max(radius,.001));
  vec3 integrated=mix(coffeeBody,ingredientColor,foldedMilk);
  vec3 incoming=mix(ingredientColor,integrated,entrainment);
  // Sugar and water disturb the surface without adding a white pigment layer.
  vec3 colour=mix(current.rgb,incoming,amount*(1.0-sugar));
  fragColor=vec4(colour,max(current.a,amount*.65));
}`;
// Sparse aeration enters the transported foam field at the pour contact.
// Coverage stays fractional; this is never a solid cream-coloured decal.
export const FOAM_POUR = `
uniform sampler2D source;
uniform vec2 centre;
uniform float radius, strength;
float hashFoam(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main() {
  vec4 current=texture(source,uv);
  vec2 d=uv-centre;
  float r=max(radius,.008);
  float ring=exp(-pow((length(d)-r*.72)/(r*.85),2.0));
  vec2 grid=uv*190.0;
  vec2 cell=floor(grid), local=fract(grid)-.5;
  float grain=hashFoam(cell);
  float bead=1.0-smoothstep(.12,.42,length(local));
  float sparse=mix(.08,.70,step(.60,grain)*bead);
  float mask=1.0-smoothstep(.46,.486,length(uv-.5));
  float added=ring*sparse*clamp(strength,0.0,.30)*mask;
  fragColor=vec4(clamp(current.r+added*(1.0-current.r),0.0,.88),current.g,current.ba);
}`;
// Marks are written into the same transported pigment and foam fields. They
// are not a picture composited over the cup and remain deformable by stirring.
export const FROTH_SHAPE = `
uniform sampler2D source, photograph;
uniform vec4 crop;
uniform vec2 centre, drawRange;
uniform float design, designScale, foamMode;
float milkMask(vec3 c) {
  // Blue/green milk content separates pale milk from amber crema. This keeps
  // the photograph's feathery transitions without copying its coffee ground.
  float pale=smoothstep(.35,.80,c.b/max(c.r,.01))*smoothstep(.58,.88,c.g);
  return smoothstep(.035,.95,pale);
}
void main() {
  vec4 current=texture(source,uv);
  vec2 d=uv-centre;
  vec2 drawingUV=vec2(.5)+d/max(designScale,.05);
  vec2 photoUV=drawingUV;
  float bounds=1.0;
  if(design>.5 && design<1.5) {
    // Isolate the photographed heart at the rosetta's tip, then scale that
    // milk deposit into the current cup. Its real feathering replaces an icon.
    vec2 heartUV=(drawingUV-.5)/vec2(.38,.48)+.5;
    bounds=smoothstep(0.0,.025,heartUV.x)*smoothstep(0.0,.025,heartUV.y)*
      (1.0-smoothstep(.975,1.0,heartUV.x))*(1.0-smoothstep(.975,1.0,heartUV.y));
    photoUV=vec2(.404,.707)+clamp(heartUV,0.0,1.0)*vec2(.193,.218);
  }
  vec3 photographed=texture(photograph,crop.xy+photoUV*crop.zw).rgb;
  float mark=milkMask(photographed)*bounds;
  vec3 milkColor=mix(vec3(.972,.922,.817),photographed,.86);
  if(design<.5) {
    // Freehand is a soft milk deposit with photographed microtexture. Gesture
    // taper is deliberately not invented without direction/pressure input.
    vec2 creamUV=vec2(.38,.49)+d*1.8;
    vec3 detail=texture(photograph,crop.xy+creamUV*crop.zw).rgb;
    float textureTone=clamp((detail.r+detail.g+detail.b)/3.0,.55,1.0);
    vec2 brush=d*vec2(.92,1.08);
    float q=dot(brush,brush)/.00018;
    mark=exp(-q*(.92+textureTone*.16))*.57;
    milkColor=vec3(.965,.911,.79)+(detail-vec3(.94,.89,.77))*.18;
  } else if(design>1.5) {
    mark*=1.0-smoothstep(.445,.48,length(drawingUV-.5));
  }
  // Borrow only high-frequency crema material from the outer coffee annulus.
  // This source ring excludes the photographed leaves/heart; neither design
  // can accidentally stamp the original rosetta into the surrounding coffee.
  float cremaPresence=0.0;
  float microbubble=0.0;
  vec3 cremaDetail=vec3(0.0);
  if(design>.5) {
    float theta=atan(d.y,d.x)+drawingUV.x*.65;
    float annulus=.457+.012*sin(drawingUV.x*11.0+drawingUV.y*7.0);
    vec2 cremaUV=vec2(.5)+vec2(cos(theta),sin(theta))*annulus;
    vec2 src=crop.xy+cremaUV*crop.zw;
    vec2 dx=vec2(crop.z*.006,0),dy=vec2(0,crop.w*.006);
    vec3 grain=texture(photograph,src).rgb;
    vec3 soft=(texture(photograph,src+dx).rgb+texture(photograph,src-dx).rgb+
      texture(photograph,src+dy).rgb+texture(photograph,src-dy).rgb+grain*2.0)/6.0;
    cremaDetail=clamp(grain-soft,vec3(-.07),vec3(.07));
    float cupRadius=max(.12,designScale*.55556);
    cremaPresence=(1.0-smoothstep(cupRadius*.84,cupRadius*.99,length(d)))*
      (1.0-smoothstep(.474,.487,length(uv-.5)));
    microbubble=smoothstep(.004,.045,dot(cremaDetail,vec3(.30,.58,.12)));
    // Milk retains the local drink's warmth at its edge instead of reading as
    // a bright cutout pasted onto a perfectly flat, unrelated background.
    if(foamMode<.5) milkColor=mix(milkColor,current.rgb,.045);
  }
  // Both milk and surrounding crema enter the live fields, and stir together.
  mark*=1.0-smoothstep(.472,.488,length(uv-.5));
  mark=clamp(mark,0.0,.97);
  float before=0.0, after=1.0;
  if(design>.5) {
    // A soft leading edge sweeps upward through the source milk pattern.
    // Endpoints cover the entire cup, including the surrounding crema.
    float scan=drawingUV.y+.008*sin(drawingUV.x*18.0);
    before=drawRange.x<=0.0 ? 0.0 :
      1.0-smoothstep(mix(-.10,1.10,drawRange.x)-.025,mix(-.10,1.10,drawRange.x)+.025,scan);
    after=drawRange.y>=1.0 ? 1.0 :
      1.0-smoothstep(mix(-.10,1.10,drawRange.y)-.025,mix(-.10,1.10,drawRange.y)+.025,scan);
  }
  float newlyLaid=max(0.0,after-before);
  // Incremental alpha reaches the same final milk opacity as one full pass.
  // Already covered pixels receive zero deposition instead of growing whiter.
  float milkStep=mark*newlyLaid/max(.001,1.0-mark*before);
  if(foamMode>.5) {
    float coverage=.82+.12*milkMask(photographed);
    float aeration=(.012+microbubble*.16)*cremaPresence*(1.0-mark);
    float foamStep=newlyLaid/max(.001,1.0-before);
    float baseFoam=mix(current.r,max(current.r,aeration),foamStep);
    fragColor=vec4(mix(baseFoam,coverage,milkStep),current.g,current.ba);
  } else {
    vec3 warmBase=current.rgb*vec3(1.055,1.018,.965)+vec3(.006,.003,0);
    vec3 base=mix(current.rgb,warmBase+cremaDetail*.72,cremaPresence*(1.0-mark)*newlyLaid);
    fragColor=vec4(mix(clamp(base,0.0,1.0),milkColor,milkStep),max(current.a,mark*after*.12));
  }
}`;
// R: foam coverage; G: relaxing displacement; B: surviving photographic
// microbubbles; A: persistent local disturbance. No bubbles are generated.
// This is an artistic thin-layer model, not measured foam chemistry.
export const FOAM_SEED = `
uniform sampler2D photograph;
uniform vec4 crop;
void main() {
  vec3 c=texture(photograph,crop.xy+uv*crop.zw).rgb;
  float milk=smoothstep(.22,.70,c.b)*smoothstep(.52,.85,c.g);
  fragColor=vec4(.06+.90*milk,0,1,0);
}`;
export const FOAM_MEAN = `
uniform sampler2D source;
void main() {
  float mask=1.0-smoothstep(.45,.47,length(uv-.5));
  float f=texture(source,uv).r;
  float weight=f*(1.0-f);
  fragColor=vec4(f,weight,f*weight,1.0)*mask;
}`;
export const FOAM_EVOLVE = `
uniform sampler2D source, forward, velocity, currentMean, referenceMean;
uniform vec2 texel;
uniform float dt, transportSpeed, relaxation;
uniform int count;
uniform vec4 positions[16], impulses[16];
uniform int contactCount;
uniform vec4 contactPositions[2], contactDirections[2];
uniform float contactFollow;
${BOUNDARY}
float impression(vec2 delta, float radius, vec2 direction) {
  float q=dot(delta,delta)/max(radius*radius,.00001);
  float radial=(q-1.0)*exp(-q);
  // Keep the trough centred. Move the raised bank toward the direction of
  // travel; the angular term integrates to zero on the full radial stamp.
  float ahead=dot(delta,direction)/max(length(delta),.0001);
  return min(radial,0.0)+max(radial,0.0)*(1.0+.85*ahead);
}
void main() {
  if(inside(uv)<.5) { fragColor=texture(source,uv); return; }
  float adt=dt*transportSpeed;
  vec2 v=texture(velocity,uv).xy;
  vec2 back=bound(uv-adt*texture(velocity,bound(uv-.5*adt*v)).xy);
  vec2 ahead=bound(uv+adt*texture(velocity,bound(uv+.5*adt*v)).xy);
  vec4 corrected=texture(forward,uv)+.5*(texture(source,uv)-texture(forward,ahead));
  vec2 grid=(floor(back/texel-.5)+.5)*texel;
  vec4 a=texture(source,bound(grid)), b=texture(source,bound(grid+vec2(texel.x,0)));
  vec4 c=texture(source,bound(grid+vec2(0,texel.y))), d=texture(source,bound(grid+texel));
  vec4 f=clamp(corrected,min(min(a,b),min(c,d)),max(max(a,b),max(c,d)));
  float rim=smoothstep(.37,.425,length(uv-.5));
  float attached=smoothstep(.452,.485,length(uv-.5));
  // A wall-bound fraction survives while free bubbles are sheared and dissolve.
  float mobility=mix(1.0,.12,attached);
  float shear=max(0.0,length(v)-.0015);
  f.a=clamp(f.a+shear*dt*8.0*rim,0.0,1.0);
  f.b*=exp(-shear*dt*2.8*mobility);
  float mask=1.0-smoothstep(.445,.481,length(uv-.5));
  // Balance sharpening around the current weighted coverage, not a fixed .5
  // threshold that would gradually erase a minority of foam. Correct numerical
  // mass drift using only a scalar reference; never reconstruct the seed pattern.
  vec4 mean=texture(currentMean,vec2(.5)), reference=texture(referenceMean,vec2(.5));
  float threshold=mean.b/max(mean.g,.0001);
  float drift=reference.r/max(reference.a,.001)-mean.r/max(mean.a,.001);
  f.r+=(f.r*(1.0-f.r)*(f.r-threshold)*.6+clamp(drift,-.08,.08)*.8)*dt;
  float neighbours=(texture(forward,uv+vec2(texel.x,0)).g+texture(forward,uv-vec2(texel.x,0)).g+
    texture(forward,uv+vec2(0,texel.y)).g+texture(forward,uv-vec2(0,texel.y)).g)*.25;
  f.g=mix(f.g,neighbours,min(dt*5.0,.20))*exp(-relaxation*dt);
  for(int i=0;i<16;i++) {
    if(i>=count) break;
    vec2 delta=uv-positions[i].xy;
    float radius=positions[i].z*.85;
    vec2 direction=impulses[i].xy/max(length(impulses[i].xy),.0001);
    float stamp=impression(delta,radius,direction);
    float strength=min(length(impulses[i].xy)*1.1+abs(impulses[i].z)*.4+abs(impulses[i].w)*1.8,.11);
    f.g+=stamp*strength*mask;
    f.r+=stamp*strength*.65*mask;
    float local=exp(-dot(delta,delta)/max(radius*radius*1.6,.00001))*rim;
    f.a=clamp(f.a+local*strength*5.0,0.0,1.0);
    f.b*=exp(-local*strength*4.5*mobility);
  }
  // The live contact imposes a bounded shape instead of continuously digging
  // deeper. After release, advection, smoothing and relaxation fill its groove.
  for(int i=0;i<2;i++) {
    if(i>=contactCount) break;
    vec2 delta=uv-contactPositions[i].xy;
    float radius=contactPositions[i].z*.70;
    float q=dot(delta,delta)/max(radius*radius,.00001);
    float target=impression(delta,radius,contactDirections[i].xy)*contactPositions[i].w;
    float follow=(1.0-exp(-contactFollow*dt))*exp(-q*.35)*mask;
    f.g=mix(f.g,target,follow);
    float touch=exp(-q*.65)*rim;
    f.a=clamp(f.a+touch*dt*5.0,0.0,1.0);
    f.b*=exp(-touch*dt*1.8*mobility);
  }
  fragColor=vec4(clamp(f.r,0.0,1.0),clamp(f.g,-.26,.20),clamp(f.ba,0.0,1.0));
}`;
export const MEAN = `
uniform sampler2D source;
void main() {
  float mask=1.0-smoothstep(.45,.47,length(uv-.5));
  fragColor=vec4(texture(source,uv).rgb*mask,mask);
}`;
export const REDUCE = `
uniform sampler2D source; uniform vec2 texel;
void main() {
  vec2 d=texel*.5;
  fragColor=.25*(texture(source,uv-d)+texture(source,uv+d)+texture(source,uv+vec2(d.x,-d.y))+texture(source,uv+vec2(-d.x,d.y)));
}`;
export const FLOW = `
uniform sampler2D velocity;
uniform vec2 texel;
uniform float dt, dissipation, viscosity, maxSpeed;
uniform int count;
uniform vec4 positions[16];
uniform vec4 impulses[16];
${BOUNDARY}
vec2 v(vec2 p) { return texture(velocity, bound(p)).xy; }
void main() {
  if (inside(uv) < .5) { fragColor = vec4(0); return; }
  vec2 current = v(uv);
  vec2 back = bound(uv - dt * v(uv - .5 * dt * current));
  vec2 velocityNext = v(back);
  vec2 left = v(uv - vec2(texel.x,0)), right = v(uv + vec2(texel.x,0));
  vec2 bottom = v(uv - vec2(0,texel.y)), top = v(uv + vec2(0,texel.y));
  velocityNext += min(viscosity * dt * 60.0, .22) * (left + right + bottom + top - 4.0 * current);
  // Spatially uneven drag is passive: it adds no idle force or periodic wobble.
  float dragVariation=.91+.14*sin(uv.x*11.0+uv.y*5.0)*sin(uv.y*8.0-uv.x*3.0);
  velocityNext *= exp(-dissipation * dragVariation * dt);
  for (int i=0; i<16; i++) {
    if (i >= count) break;
    vec2 d = uv - positions[i].xy;
    float radius = positions[i].z;
    float g = exp(-dot(d,d) / (radius * radius));
    vec2 tangent = vec2(-d.y, d.x) / max(radius, .001);
    velocityNext += impulses[i].xy * g;
    velocityNext += tangent * impulses[i].z * g;
    // Curl of psi=(Fx*y-Fy*x)*Gaussian: a divergence-free translating dipole.
    // Its return flow prevents strokes from artificially inflating the milk area.
    vec2 motion = impulses[i].xy;
    float side = dot(d, vec2(-motion.y, motion.x)) / max(length(motion)*radius, .0001);
    velocityNext += tangent * side * length(motion) * 2.0 * g;
    velocityNext += d / max(radius,.001) * impulses[i].w * g;
  }
  vec2 radial = normalize(uv - .5 + vec2(.000001));
  float wall = smoothstep(.445, .487, length(uv - .5));
  velocityNext -= radial * dot(velocityNext, radial) * wall;
  velocityNext *= exp(-12.0 * wall * dt);
  float speed = length(velocityNext);
  velocityNext *= min(1.0, maxSpeed / max(speed,.0001));
  fragColor = vec4(velocityNext, 0, 1);
}
`;
export const DIVERGENCE = `
uniform sampler2D velocity;
uniform vec2 texel;
${BOUNDARY}
vec2 flux(vec2 p) {
  vec2 value=texture(velocity,p).xy;
  return value*inside(p)*vec2(inside(p+vec2(texel.x,0)),inside(p+vec2(0,texel.y)));
}
void main() {
  vec2 current=flux(uv);
  float d=current.x-flux(uv-vec2(texel.x,0)).x+current.y-flux(uv-vec2(0,texel.y)).y;
  fragColor=vec4(d*inside(uv),0,0,1);
}
`;
export const PRESSURE = `
uniform sampler2D pressure, divergence;
uniform vec2 texel;
uniform float relaxation;
${BOUNDARY}
float p(vec2 pos, float center) { return inside(pos) > .5 ? texture(pressure,pos).r * relaxation : center; }
void main() {
  float c = texture(pressure,uv).r * relaxation;
  float sum = p(uv+vec2(texel.x,0),c)+p(uv-vec2(texel.x,0),c)+p(uv+vec2(0,texel.y),c)+p(uv-vec2(0,texel.y),c);
  fragColor = vec4((sum-texture(divergence,uv).r)*.25*inside(uv),0,0,1);
}
`;
export const PROJECT = `
uniform sampler2D pressure, velocity;
uniform vec2 texel;
uniform float retention;
${BOUNDARY}
float p(vec2 pos,float c) {return inside(pos)>.5?texture(pressure,pos).r:c;}
void main() {
  float c=texture(pressure,uv).r;
  // Forward gradient + backward divergence exactly match the Jacobi Laplacian.
  vec2 v=texture(velocity,uv).xy-vec2(p(uv+vec2(texel.x,0),c)-c,p(uv+vec2(0,texel.y),c)-c);
  v*=vec2(inside(uv+vec2(texel.x,0)),inside(uv+vec2(0,texel.y)));
  fragColor=vec4(v*inside(uv)*retention,0,1);
}
`;
export const ADVECT = `
uniform sampler2D pigment, velocity;
uniform float dt;
${BOUNDARY}
void main() {
  vec2 v = texture(velocity,uv).xy;
  vec2 back = bound(uv-dt*texture(velocity,bound(uv-.5*dt*v)).xy);
  fragColor = texture(pigment, back);
}
`;
// Two-pass MacCormack advection with local extrema limiting preserves fine milk strands.
export const CORRECT = `
uniform sampler2D pigment, forward, velocity, currentMean, referenceMean;
uniform vec2 texel;
uniform float dt, conservationGain;
${BOUNDARY}
void main() {
  vec2 v=texture(velocity,uv).xy;
  vec2 back=bound(uv-dt*texture(velocity,bound(uv-.5*dt*v)).xy);
  vec2 ahead=bound(uv+dt*texture(velocity,bound(uv+.5*dt*v)).xy);
  vec3 corrected=texture(forward,uv).rgb+.5*(texture(pigment,uv).rgb-texture(forward,ahead).rgb);
  vec2 grid=(floor(back/texel-.5)+.5)*texel;
  vec3 a=texture(pigment,bound(grid)).rgb;
  vec3 b=texture(pigment,bound(grid+vec2(texel.x,0))).rgb;
  vec3 c=texture(pigment,bound(grid+vec2(0,texel.y))).rgb;
  vec3 d=texture(pigment,bound(grid+texel)).rgb;
  vec3 color=clamp(corrected,min(min(a,b),min(c,d)),max(max(a,b),max(c,d)));
  vec4 mean=texture(currentMean,vec2(.5)), reference=texture(referenceMean,vec2(.5));
  vec3 drift=mean.rgb/max(mean.a,.001)-reference.rgb/max(reference.a,.001);
  color-=clamp(drift,vec3(-.12),vec3(.12))*conservationGain*dt*60.0*inside(uv);
  fragColor=vec4(clamp(color,0.0,1.0),min(1.0,texture(pigment,back).a+length(v)*dt*1.6));
}
`;
export const COMPOSITE = `
uniform sampler2D pigment, velocity, pristine, currentMean, foamSurface;
uniform vec4 crop;
uniform vec4 ripples[12];
uniform vec4 sugarGrains[16];
uniform float rippleSpeed, rippleDamping, edgeGuard, pristineMix, materialRelief, mixedContrast;
uniform vec2 pixel;
uniform vec2 foamPixel;
uniform float foamRelief, foamPresence, displayFill, originalStyle, wettingBase;
uniform vec4 pourImpact;
${BOUNDARY}
float surfaceHeight(vec2 p) {
  vec2 f=texture(foamSurface,bound(p)).rg;
  return f.r*.003+f.g*foamRelief;
}
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float grainNoise(vec2 p) {
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float foam(vec2 p) { return .58*grainNoise(p)+.28*grainNoise(p*2.03+4.1)+.14*grainNoise(p*4.17-2.8); }
void main() {
  vec2 normal=vec2(0);
  for(int i=0;i<12;i++) {
    vec2 delta=uv-ripples[i].xy;
    float distance=length(delta), age=ripples[i].z, amplitude=ripples[i].w;
    float wave=distance-age*rippleSpeed;
    float envelope=exp(-wave*wave/0.00085)*exp(-age*rippleDamping);
    normal += delta/max(distance,.003) * cos(wave*110.0) * envelope * amplitude;
  }
  float radius=length(uv-.5);
  float interior=1.0-smoothstep(.5-edgeGuard-.006,.5-edgeGuard,radius);
  vec4 foamState=texture(foamSurface,bound(uv));
  float rimBand=smoothstep(.37,.425,radius)*(1.0-smoothstep(.484,.490,radius));
  float workedRim=foamState.a*rimBand*originalStyle;
  // The untouched photographic boundary remains exact; only a contacted rim
  // reveals its transported texture instead of staying painted on the vessel.
  interior=max(interior,workedRim);
  vec2 offset=normal*.12*interior;
  vec2 impactDelta=uv-pourImpact.xy;
  float creamImpact=pourImpact.z*pourImpact.w;
  // A compact plunge bends the existing surface and its reflections locally.
  // No cup-wide vortex, texture replacement or persistent white spot is added.
  float impactLens=exp(-dot(impactDelta,impactDelta)/.0025)*creamImpact;
  offset+=impactDelta*impactLens*.16;
  vec4 surface=texture(pigment,bound(uv+offset));
  vec3 color=surface.rgb;
  // Emulsion relief appears only in disturbed areas, never reconstructs rosetta
  // lines, and remains quiet when settled. Domain warping avoids a tiled pattern.
  float mixed=smoothstep(.08,.75,surface.a);
  vec4 meanSample=texture(currentMean,vec2(.5));
  vec3 mean=meanSample.rgb/max(meanSample.a,.001);
  // Retain contrast in the transported milk filaments without restoring the
  // original pattern or progressively brightening the entire beverage.
  vec3 variation=color-mean;
  float emulsion=1.0-smoothstep(.04,.20,length(variation));
  color+=variation*mixed*mixedContrast*emulsion;
  vec2 warped=uv*7.0+vec2(foam(uv*4.0+2.1),foam(uv*4.0-3.7))*2.4;
  float islands=foam(warped);
  float veins=exp(-abs(foam(warped*1.8+islands*3.0)-.51)*28.0)-.15;
  color+=(islands-.5+veins*.22)*vec3(1.0,.82,.56)*materialRelief*mixed;
  // Actual crema grain from the photograph's annulus, without repeating a tiny
  // square patch. The high-pass sample carries bubbles, not the initial art.
  float angle=atan(uv.y-.5,uv.x-.5)+foam(uv*6.0)*3.0;
  float ring=.405+.035*grainNoise(uv*33.0);
  vec2 grainUV=crop.xy+(vec2(.5)+vec2(cos(angle),sin(angle))*ring)*crop.zw;
  vec3 grainA=texture(pristine,grainUV).rgb;
  vec3 grainB=(texture(pristine,grainUV+vec2(.0025,0)).rgb+texture(pristine,grainUV-vec2(.0025,0)).rgb)*.5;
  color+=(grainA-grainB)*.24*mixed;
  // Persistent transported foam supplies material islands after the pigment
  // filaments soften. No blend back to the original latte art is involved.
  vec2 layer=texture(foamSurface,bound(uv+offset)).rg;
  float cover=smoothstep(.06,.96,layer.r);
  vec3 cream=vec3(.96,.895,.755)+(islands-.5)*.025;
  vec3 material=mix(color*vec3(.94,.92,.89),cream,cover);
  color=mix(color,material,mixed*foamPresence*originalStyle);
  // New drinks use their own fractional, advected aeration. Fine highlights
  // reveal tiny bubbles while the coffee colour remains visible beneath them.
  float freshCoverage=smoothstep(.006,.30,layer.r)*(1.0-originalStyle);
  float milkFoam=smoothstep(.14,.28,foamPresence);
  vec3 freshCream=mix(mix(mean,vec3(.80,.58,.31),.32),vec3(.92,.86,.72),milkFoam);
  float micrograin=grainNoise((uv+offset)*190.0);
  float freshOpacity=freshCoverage*foamPresence*(.42+micrograin*.58);
  color=mix(color,freshCream,freshOpacity);
  color+=freshCoverage*foamPresence*smoothstep(.63,.82,micrograin)*vec3(.11,.095,.065);
  // Dissolving microbubbles lose their fine photographic contrast. The broad
  // colour and remaining wall-bound bubbles survive; no synthetic fizz appears.
  vec2 bubbleStep=vec2(.0055,0);
  vec3 softened=(texture(pigment,bound(uv+offset+bubbleStep)).rgb+
    texture(pigment,bound(uv+offset-bubbleStep)).rgb+
    texture(pigment,bound(uv+offset+bubbleStep.yx)).rgb+
    texture(pigment,bound(uv+offset-bubbleStep.yx)).rgb+surface.rgb*2.0)/6.0;
  float breakup=workedRim*(1.0-foamState.b);
  color=mix(color,softened,breakup*.92);
  // Local depth cues follow signed displacement, not every foam filament.
  // A depressed patch reveals warmer coffee; the displaced bank catches milk.
  // Both disappear as the groove fills, without recovering the original art.
  float cavity=smoothstep(.035,.24,max(0.0,-layer.g));
  float bank=smoothstep(.012,.075,max(0.0,layer.g));
  vec3 coffee=mix(mean,vec3(.47,.24,.10),.32);
  color=mix(color,coffee,cavity*.28*interior);
  color=mix(color,mix(mean+vec3(.13,.11,.075),cream,originalStyle),bank*mix(.14,.22*(.35+.65*cover),originalStyle)*interior);
  // Shade over a physical patch rather than individual texels: thin pigment
  // strands should not acquire the steep, bright rims of crumpled foil.
  vec2 normalStep=max(foamPixel*2.0,vec2(.009));
  float left=surfaceHeight(uv-vec2(normalStep.x,0)), right=surfaceHeight(uv+vec2(normalStep.x,0));
  float bottom=surfaceHeight(uv-vec2(0,normalStep.y)), top=surfaceHeight(uv+vec2(0,normalStep.y));
  vec2 slope=vec2(right-left,top-bottom)/(2.0*normalStep);
  vec3 light=normalize(vec3(-.32,.42,1.6));
  vec3 reliefNormal=normalize(vec3(-slope*1.1,1.0));
  float reliefAmount=max(mixed,min(1.0,abs(layer.g)*18.0));
  float reliefLight=clamp(dot(reliefNormal,light)-light.z,-.16,.12);
  color+=reliefLight*mix(.09,.34,originalStyle)*reliefAmount*interior;
  color*=1.0-min(.045,max(0.0,-layer.g)*.20)*interior*mix(.30,1.0,originalStyle);
  // Sub-millimetre glints, not a moving environment map or metallic sheen.
  float wetness=dot(normal,vec2(-.55,.75))*2.4;
  vec2 vel=texture(velocity,uv).xy;
  vec2 a=texture(velocity,uv+pixel).xy-vel;
  wetness+=clamp(dot(a,vec2(-.25,.4)),-.012,.012)*interior;
  color+=wetness;
  // A soft reflected window makes the surface read as wet, while its narrow
  // highlight bends with local ripples. It carries no source latte pattern.
  vec2 reflection=uv+normal*.35+slope*.018-vec2(.34,.79);
  float window=exp(-pow(abs((reflection.x+reflection.y*.55)/.14),4.0)-pow(abs(reflection.y/.023),2.0));
  float windowHalo=exp(-dot(reflection*vec2(3.0,8.0),reflection*vec2(3.0,8.0)))*.028;
  float gloss=(window*.055+windowHalo*.65)*interior;
  color=mix(color,vec3(.98,.94,.83),gloss*(1.0-originalStyle));
  vec3 original=texture(pristine,crop.xy+uv*crop.zw).rgb;
  color=mix(color,original,pristineMix*originalStyle);
  float creamDimple=exp(-dot(impactDelta,impactDelta)/.00024)*creamImpact;
  color*=1.0-creamDimple*.13;
  // Temporary crystals catch light, then dissolve. They never enter the milk
  // pigment or foam fields, so sugar cannot leave a white bloom behind.
  for(int i=0;i<16;i++) {
    vec4 grain=sugarGrains[i];
    if(grain.w<=0.0) continue;
    float dissolve=(1.0-smoothstep(.18,.64,grain.z))*smoothstep(0.0,.05,grain.z);
    vec2 delta=uv-grain.xy;
    delta.x+=grain.z*.004;
    float crystal=1.0-smoothstep(grain.w*.65,grain.w,length(delta));
    color=mix(color,vec3(.99,.975,.90),crystal*dissolve*.90);
  }
  float ceramicEdge=smoothstep(.493,.506,radius);
  vec3 meniscus=color*(1.0-.08*smoothstep(.435,.493,radius));
  vec3 fullSurface=mix(mix(meniscus,original,ceramicEdge),mix(original,color,interior),originalStyle);
  // A recessed bowl gives a pour somewhere to arrive. The pool expands and
  // rises from its lower centre; material remains the live pigment field.
  float fill=clamp(displayFill,0.0,1.0);
  vec2 poolCentre=vec2(.5,.5-.025*(1.0-fill));
  float poolRadius=.34+.16*pow(fill,.40);
  vec2 poolDelta=(uv-poolCentre)*vec2(1.0,1.0+.045*(1.0-fill));
  float poolDistance=length(poolDelta);
  float shallow=(1.0-originalStyle)*(1.0-smoothstep(.08,.60,fill));
  float contactAngle=atan(poolDelta.y,poolDelta.x);
  float film=(1.0-originalStyle)*step(.5,wettingBase)*(1.0-smoothstep(.015,.10,fill));
  // Subpixel capillary irregularity, fixed to the floor rather than wobbling.
  // The volume-driven centre and radius remain unchanged.
  float contactOffset=(sin(contactAngle*3.0+.7)*.0012+
    sin(contactAngle*7.0-1.1)*.0006)*shallow;
  // The first base pour wets a thin, gently scalloped sheet ahead of its deeper
  // pool. Its reach still grows with the same volume-driven footprint.
  contactOffset+=film*(sin(contactAngle*5.0+.8)*.0012+sin(contactAngle*9.0-1.4)*.0006);
  float filmReach=film*.005*smoothstep(0.0,.015,fill);
  float contactDistance=poolDistance-poolRadius-filmReach+contactOffset;
  float edge=1.0-smoothstep(-.004,.004,contactDistance);
  edge*=smoothstep(0.0,1.0/60.0,fill);
  float wall=smoothstep(.31,.50,radius);
  float bowlShade=.985-.19*wall+.038*(uv.y-.5);
  vec3 ceramic=vec3(.895,.856,.773)*bowlShade;
  // A shallow pool contacts the ceramic. A narrow contact shadow avoids the
  // broad drop shadow that would make it read as a raised brown disc.
  float shadowWidth=mix(.018,.007,shallow);
  float wallShadow=exp(-pow((contactDistance-.003)/shadowWidth,2.0))*(1.0-fill)*mix(.055,.018,shallow)*smoothstep(0.0,1.0/60.0,fill);
  ceramic*=1.0-wallShadow;
  float lip=exp(-pow((contactDistance+.0035)/.0045,2.0));
  vec3 pool=fullSurface*(1.0-lip*.05*(1.0-fill));
  // The white ceramic remains visible through the first amber sheet. Increasing
  // depth absorbs it gradually; cream/milk and the original latte bypass this.
  float clearFraction=clamp(wettingBase-1.0,0.0,1.0);
  vec3 filterTint=mix(vec3(.78,.54,.25),vec3(.995,.984,.952),clearFraction);
  float centreDepth=(1.0-smoothstep(.12,.95,poolDistance/max(poolRadius+filmReach,.001)));
  float absorption=.10+centreDepth*(.10+smoothstep(.015,.20,fill)*.50);
  vec3 thinSheet=mix(ceramic*filterTint,fullSurface,absorption);
  // A very narrow advancing front holds slightly more liquid than its film.
  thinSheet*=1.0-lip*.045;
  pool=mix(pool,thinSheet,film);
  float impactDistance=length(uv-pourImpact.xy);
  float dimple=exp(-pow(impactDistance/.021,2.0))*pourImpact.z*film;
  float impactBank=exp(-pow((impactDistance-.028)/.008,2.0))*pourImpact.z*film;
  pool=mix(pool,ceramic*vec3(1.04,1.03,1.0),dimple*.40);
  pool*=1.0-impactBank*.075;
  vec2 poolUV=poolDelta/max(poolRadius,.001);
  // The reflected softbox scales with the exposed liquid. The previous
  // full-cup reflection lay outside a 5 ml pool and left it completely matte.
  vec2 localReflection=poolUV+normal*.6+slope*.025-vec2(-.20,.32);
  float poolWindow=exp(-pow(abs((localReflection.x+localReflection.y*.45)/.47),4.0)-pow(abs(localReflection.y/.085),2.0));
  float poolHalo=exp(-dot(localReflection*vec2(1.7,3.0),localReflection*vec2(1.7,3.0)))*.032;
  float contactLight=max(0.0,dot(poolDelta/max(poolDistance,.001),normalize(vec2(-.5,.8))));
  float wetEdge=exp(-pow((contactDistance+.0015)/.0026,2.0))*contactLight*.035;
  pool*=1.0-shallow*.045*(1.0-smoothstep(.0,1.0,length(poolUV)));
  pool=mix(pool,vec3(.96,.91,.79),shallow*(poolWindow*.065+poolHalo*.55+wetEdge));
  vec3 recessed=mix(ceramic,pool,edge);
  recessed=mix(recessed,original,ceramicEdge);
  // At the photographic brim, the original Befrothed path is exact.
  fragColor=vec4(mix(recessed,fullSurface,smoothstep(.97,1.0,fill)),1.0);
}
`;

export const VORTICITY = `
uniform sampler2D velocity;
uniform vec2 texel;
void main() {
  float c=.5*(texture(velocity,uv+vec2(texel.x,0)).y-texture(velocity,uv-vec2(texel.x,0)).y-texture(velocity,uv+vec2(0,texel.y)).x+texture(velocity,uv-vec2(0,texel.y)).x);
  fragColor=vec4(c,0,0,1);
}
`;
export const CONFINEMENT = `
uniform sampler2D velocity, vorticity;
uniform vec2 texel;
uniform float dt, strength;
${BOUNDARY}
void main() {
  float c=texture(vorticity,uv).r;
  vec2 grad=.5*vec2(abs(texture(vorticity,uv+vec2(texel.x,0)).r)-abs(texture(vorticity,uv-vec2(texel.x,0)).r),abs(texture(vorticity,uv+vec2(0,texel.y)).r)-abs(texture(vorticity,uv-vec2(0,texel.y)).r));
  grad/=length(grad)+.00001;
  vec2 force=vec2(grad.y,-grad.x)*c*strength*(1.0-smoothstep(.44,.48,length(uv-.5)));
  vec2 v=texture(velocity,uv).xy+force*dt;
  fragColor=vec4(v*inside(uv),0,1);
}
`;
