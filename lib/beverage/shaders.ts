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
uniform sampler2D source;
uniform vec3 ingredientColor;
uniform vec2 centre;
uniform float radius, strength, phase, sugar;
void main() {
  vec4 current=texture(source,uv);
  vec2 d=uv-centre;
  float theta=atan(d.y,d.x);
  float shape=1.0+.23*sin(theta*5.0+phase*.65)+.13*sin(theta*11.0-phase*.7)+.06*sin(theta*23.0+phase);
  float distance=length(d)*shape;
  float plume=exp(-distance*distance/(radius*radius*.52));
  // Fine branching tongues enter the pigment field and travel with the flow;
  // these are actual transported additions, not a stationary surface overlay.
  float fingers=pow(.5+.5*sin(theta*9.0+sin(theta*4.0)*1.8-distance/radius*7.0+phase*.8),10.0);
  float skirtDistance=(distance-radius*.90)/(radius*.50);
  float skirt=exp(-skirtDistance*skirtDistance)*fingers;
  float mask=1.0-smoothstep(.44,.48,length(uv-.5));
  float amount=clamp((plume+.68*skirt)*strength*mask,0.0,.94);
  // Sugar and water disturb the surface without adding a white pigment layer.
  vec3 colour=mix(current.rgb,ingredientColor,amount*(1.0-sugar));
  fragColor=vec4(colour,max(current.a,amount*.65));
}`;
// Marks are written into the same transported pigment and foam fields. They
// are not a picture composited over the cup and remain deformable by stirring.
export const FROTH_SHAPE = `
uniform sampler2D source;
uniform vec2 centre;
uniform float design, designScale, foamMode;
void main() {
  vec4 current=texture(source,uv);
  vec2 d=uv-centre;
  vec2 drawingUV=vec2(.5)+d/max(designScale,.05);
  float mark=exp(-dot(d,d)/.00017)*.65;
  if(design>.5 && design<1.5) {
    vec2 p=(drawingUV-vec2(.5,.49))/vec2(.17,.20);
    float q=dot(p,p)-1.0;
    float heart=q*q*q-p.x*p.x*p.y*p.y*p.y;
    mark=(1.0-smoothstep(-.035,.035,heart))*.88;
  } else if(design>1.5) {
    mark=0.0;
    for(int i=0;i<7;i++) {
      float t=float(i)/6.0;
      float y=.30+t*.36;
      float spread=.145*(1.0-t*.75);
      for(int side=-1;side<=1;side+=2) {
        vec2 q=drawingUV-vec2(.5+float(side)*spread*.40,y);
        q.x+=float(side)*q.y*.7;
        q/=vec2(spread,.020+.009*(1.0-t));
        mark=max(mark,exp(-dot(q,q)*2.2)*.90);
      }
    }
    vec2 stem=(drawingUV-vec2(.5,.48))/vec2(.008,.24);
    mark=max(mark,exp(-dot(stem,stem)*1.5)*.72);
  }
  mark*=1.0-smoothstep(.40,.46,length(uv-.5));
  if(foamMode>.5) fragColor=vec4(mix(current.r,.93,mark),current.g,0,1);
  else fragColor=vec4(mix(current.rgb,vec3(.98,.91,.77),mark),max(current.a,mark*.2));
}`;
// R: persistent foam coverage; G: signed, relaxing surface displacement.
// This is an artistic thin-layer model, not measured foam chemistry.
export const FOAM_SEED = `
uniform sampler2D photograph;
uniform vec4 crop;
void main() {
  vec3 c=texture(photograph,crop.xy+uv*crop.zw).rgb;
  float milk=smoothstep(.22,.70,c.b)*smoothstep(.52,.85,c.g);
  fragColor=vec4(.06+.90*milk,0,0,1);
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
  vec2 corrected=texture(forward,uv).rg+.5*(texture(source,uv).rg-texture(forward,ahead).rg);
  vec2 grid=(floor(back/texel-.5)+.5)*texel;
  vec2 a=texture(source,bound(grid)).rg, b=texture(source,bound(grid+vec2(texel.x,0))).rg;
  vec2 c=texture(source,bound(grid+vec2(0,texel.y))).rg, d=texture(source,bound(grid+texel)).rg;
  vec2 f=clamp(corrected,min(min(a,b),min(c,d)),max(max(a,b),max(c,d)));
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
  }
  fragColor=vec4(clamp(f.r,0.0,1.0),clamp(f.g,-.26,.20),0,1);
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
uniform float rippleSpeed, rippleDamping, edgeGuard, pristineMix, materialRelief, mixedContrast;
uniform vec2 pixel;
uniform vec2 foamPixel;
uniform float foamRelief, foamPresence, displayFill, originalStyle;
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
  vec2 offset=normal*.12*interior;
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
  color=mix(color,material,mixed*foamPresence);
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
  color+=reliefLight*.34*reliefAmount*interior;
  color*=1.0-min(.045,max(0.0,-layer.g)*.20)*interior;
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
  float gloss=(window*.15+windowHalo)*interior;
  color=mix(color,vec3(.98,.94,.83),gloss*(1.0-originalStyle));
  vec3 original=texture(pristine,crop.xy+uv*crop.zw).rgb;
  color=mix(color,original,pristineMix*originalStyle);
  float ceramicEdge=smoothstep(.493,.506,radius);
  vec3 meniscus=color*(1.0-.20*smoothstep(.435,.493,radius));
  vec3 fullSurface=mix(mix(meniscus,original,ceramicEdge),mix(original,color,interior),originalStyle);
  // A recessed bowl gives a pour somewhere to arrive. The pool expands and
  // rises from its lower centre; material remains the live pigment field.
  float fill=clamp(displayFill,0.0,1.0);
  vec2 poolCentre=vec2(.5,.5-.042*(1.0-fill));
  float poolRadius=.10+.40*pow(fill,.55);
  float poolDistance=length((uv-poolCentre)*vec2(1.0,1.0+.10*(1.0-fill)));
  float edge=1.0-smoothstep(poolRadius-.005,poolRadius+.005,poolDistance);
  edge*=smoothstep(0.0,.012,fill);
  float wall=smoothstep(.24,.50,radius);
  float bowlShade=.96-.13*wall+.028*(uv.y-.5);
  vec3 ceramic=vec3(.895,.856,.773)*bowlShade;
  float wallShadow=exp(-pow((poolDistance-poolRadius-.007)/.018,2.0))*(1.0-fill)*.10*smoothstep(0.0,.012,fill);
  ceramic*=1.0-wallShadow;
  float lip=exp(-pow((poolDistance-poolRadius+.004)/.006,2.0));
  vec3 pool=fullSurface*(1.0-lip*.13*(1.0-fill));
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
