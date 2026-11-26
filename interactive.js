const $ = id => document.getElementById(id);
const section=$('interactive'),stage=$('cloud-stage'),status=$('cloud-status');
let catalog,cloudIndex,THREE,renderer,camera,controls,scenes=[],currentScene,currentMethod,active=false,loading=false,token=0,request,resizeObserver,initializing;
let pendingSelection=new URLSearchParams(location.search), homeView;
const announce=message=>{$('cloud-announcement').textContent=message;};
const pairId=()=>`${currentScene.id}-${currentMethod.toLowerCase()}`;
function showStatus(message,error=false){status.hidden=false;$('cloud-status-text').textContent=message;$('cloud-retry').hidden=!error;stage.setAttribute('aria-busy',String(!error));}
function choose(sceneId,method){
 currentScene=catalog.scenes.find(s=>s.id===sceneId)||catalog.scenes[0];currentMethod=catalog.methods.includes(method)?method:'CUT3R';
 $('cloud-scene').value=currentScene.id;$('cloud-title').textContent=currentScene.name;$('cloud-baseline').textContent=currentMethod;$('cloud-ours').textContent=`${currentMethod} + Ours`;
 for(const button of $('cloud-methods').children){let selected=button.dataset.method===currentMethod;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));}
 if(active)loadPair();
}
function render(){
 if(!renderer||!camera)return;
 const width=stage.clientWidth,height=stage.clientHeight,stacked=width<640;
 renderer.setSize(width,height,false);camera.aspect=stacked?width/(height/2):(width/2)/height;camera.updateProjectionMatrix();
 renderer.setScissorTest(true);
 for(let i=0;i<2;i++){
  const viewport=stacked?[0,(1-i)*height/2,width,height/2]:[i*width/2,0,width/2,height];
  renderer.setViewport(...viewport);renderer.setScissor(...viewport);renderer.clear();if(scenes[i])renderer.render(scenes[i],camera);
 }
}
function clearScenes(){for(const scene of scenes){for(const object of [...scene.children]){object.geometry?.dispose();object.material?.dispose();scene.remove(object);}}scenes=[];}
async function initialize(){
 if(renderer)return;
 if(initializing)return initializing;
 initializing=(async()=>{
 THREE=await import('three');const {OrbitControls}=await import('./vendor/OrbitControls.js');
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xf8f9fb,1);renderer.autoClear=false;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Synchronized point clouds. Drag to orbit, scroll to zoom, right-drag to pan. Arrow keys pan.');stage.prepend(canvas);
 camera=new THREE.PerspectiveCamera(45,1,.01,1000);camera.up.set(0,-1,0);
 controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.screenSpacePanning=true;controls.rotateSpeed=.8;controls.zoomSpeed=.9;controls.listenToKeyEvents(canvas);controls.addEventListener('change',render);
 canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();showStatus('The 3D view was interrupted. Reload the page to restore it.',true);});
 resizeObserver=new ResizeObserver(render);resizeObserver.observe(stage);render();
 })();
 try{return await initializing;}catch(error){initializing=null;throw error;}
}
async function fetchCloud(source,signal){
 const response=await fetch(source,{signal});if(!response.ok)throw new Error(`Point cloud request failed (${response.status})`);
 const buffer=await response.arrayBuffer();if(buffer.byteLength<8)throw new Error('Incomplete point cloud');
 const header=new DataView(buffer);if(header.getUint32(0,true)!==0x31435053)throw new Error('Invalid point cloud format');
 const count=header.getUint32(4,true);if(buffer.byteLength!==8+count*15||count<1||count>600000)throw new Error('Invalid point cloud size');
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,8,count*3),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Uint8Array(buffer,8+count*12,count*3),3,true));geometry.computeBoundingSphere();
 // Emit the original RGB directly; no tone mapping or color enhancement.
 const material=new THREE.ShaderMaterial({uniforms:{pointSize:{value:2*renderer.getPixelRatio()}},vertexShader:'attribute vec3 color; varying vec3 rgb; uniform float pointSize; void main(){rgb=color; gl_PointSize=pointSize; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 rgb; void main(){vec2 p=gl_PointCoord-vec2(.5);if(dot(p,p)>.25)discard;gl_FragColor=vec4(rgb,1.0);}',depthTest:true,depthWrite:true});
 return new THREE.Points(geometry,material);
}
async function loadPair(){
 const version=++token;request?.abort();request=new AbortController();const signal=request.signal;loading=true;showStatus('Loading point clouds…');$('cloud-reset').disabled=true;
 try{
  await initialize();if(version!==token)return;
  cloudIndex??=await fetch('./clouds/index.json').then(r=>{if(!r.ok)throw new Error('Cloud index unavailable');return r.json();});if(version!==token)return;
  const pair=cloudIndex.pairs[pairId()];if(!pair)throw new Error('Point clouds unavailable');
  const results=await Promise.allSettled([fetchCloud(pair.baseline.src,signal),fetchCloud(pair.ours.src,signal)]);
  if(version!==token||results.some(r=>r.status==='rejected')){
   for(const r of results)if(r.status==='fulfilled'){r.value.geometry.dispose();r.value.material.dispose();}
   if(version===token)throw results.find(r=>r.status==='rejected').reason;return;
  }
  clearScenes();scenes=results.map(r=>{const scene=new THREE.Scene();scene.add(r.value);return scene;});
  const target=new THREE.Vector3(...pair.camera.target),direction=new THREE.Vector3(...pair.camera.direction).normalize();let radius=0;
  for(const scene of scenes){const sphere=scene.children[0].geometry.boundingSphere;radius=Math.max(radius,sphere.center.distanceTo(target)+sphere.radius);}
  const aspect=stage.clientWidth<640?stage.clientWidth/(stage.clientHeight/2):(stage.clientWidth/2)/stage.clientHeight;
  const halfFov=Math.min(Math.PI/8,Math.atan(Math.tan(Math.PI/8)*aspect));const distance=Math.max(pair.camera.distance_m,radius/Math.sin(halfFov)*1.08);
  homeView={target:target.clone(),position:target.clone().addScaledVector(direction,-distance)};
  camera.near=Math.max(.001,distance/10000);camera.far=Math.max(100,distance+radius*20);controls.minDistance=Math.max(.02,radius*.02);controls.maxDistance=distance*20;
  controls.target.copy(homeView.target);camera.position.copy(homeView.position);camera.up.set(0,-1,0);controls.update();controls.saveState();render();
  loading=false;status.hidden=true;stage.setAttribute('aria-busy','false');stage.dataset.pair=pairId();$('cloud-reset').disabled=false;
  $('cloud-detail').textContent='500 input frames · Point clouds downsampled for interactive viewing';announce(`${currentScene.name}, ${currentMethod} point clouds loaded. Both panels share one camera.`);
 }catch(error){if(version!==token||error.name==='AbortError')return;loading=false;clearScenes();render();showStatus('Unable to load the 3D view. Please try again.',true);announce('Point clouds could not be loaded.');console.error(error);}
}
$('cloud-reset').addEventListener('click',()=>{if(controls&&!loading){controls.reset();render();announce('Both views reset.');}});
$('cloud-retry').addEventListener('click',()=>{if(!renderer&&THREE){location.reload();return;}loadPair();});
window.addEventListener('comparisonchange',event=>{pendingSelection=new URLSearchParams({scene:event.detail.sceneId,method:event.detail.method});if(catalog)choose(event.detail.sceneId,event.detail.method);});
try{
 const response=await fetch('./catalog.json');if(!response.ok)throw new Error('Scene catalog unavailable');catalog=await response.json();
 $('cloud-scene').replaceChildren(...catalog.scenes.map(scene=>{const option=document.createElement('option');option.value=scene.id;option.textContent=`${scene.name} · seq-01`;return option;}));
 $('cloud-methods').replaceChildren(...catalog.methods.map(method=>{const button=document.createElement('button');button.type='button';button.className='method-tab';button.dataset.method=method;button.textContent=method;button.addEventListener('click',()=>{choose(currentScene.id,method);history.replaceState(null,'',`?scene=${currentScene.id}&method=${currentMethod}#interactive`);});return button;}));
 $('cloud-scene').addEventListener('change',()=>{choose($('cloud-scene').value,currentMethod);history.replaceState(null,'',`?scene=${currentScene.id}&method=${currentMethod}#interactive`);});choose(pendingSelection.get('scene'),pendingSelection.get('method'));
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){active=true;observer.disconnect();loadPair();}},{rootMargin:'150px'});observer.observe(section);
}catch(error){showStatus('Unable to load the scene list. Please refresh the page.',false);console.error(error);}
