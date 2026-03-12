'use strict';
// =============================================================================
// SHADOWNET — Interactive 3D Globe (Three.js)
// Renders an interactive globe with theater markers, arcs, and atmosphere.
// =============================================================================

(function () {

// Theater center coordinates [lat, lng]
var THEATER_COORDS = {
  MIDDLE_EAST:     [29.0,  44.0],
  EASTERN_EUROPE:  [50.0,  30.0],
  CENTRAL_ASIA:    [33.0,  68.0],
  EAST_ASIA:       [25.0, 110.0],
  AFRICA:          [ 5.0,  20.0],
  LATIN_AMERICA:   [-5.0, -65.0],
  WESTERN_EUROPE:  [48.0,   8.0],
  NORTH_AMERICA:   [39.0, -98.0],
};

var globe = null;
var renderer, scene, camera, controls;
var earthMesh, atmosphereMesh, markerGroup, arcGroup, ringGroup;
var animId = null;
var container = null;
var isVisible = false;
var mouseDown = false;
var autoRotate = true;
var autoRotateSpeed = 0.001;
var targetRotY = null;
var targetRotX = null;
var hoveredMarker = null;
var tooltipEl = null;

// Convert lat/lng to 3D position on sphere
function latLngToVec3(lat, lng, radius) {
  var phi = (90 - lat) * Math.PI / 180;
  var theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
     (radius * Math.cos(phi)),
     (radius * Math.sin(phi) * Math.sin(theta))
  );
}

// Create Earth geometry with grid lines
function createEarth() {
  var radius = 2;

  // Main sphere — dark with subtle wireframe feel
  var earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  var earthMat = new THREE.MeshPhongMaterial({
    color: 0x0a0e18,
    emissive: 0x040810,
    specular: 0x111828,
    shininess: 15,
    transparent: true,
    opacity: 0.92,
  });
  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // Wireframe overlay — latitude/longitude grid
  var wireGeo = new THREE.SphereGeometry(radius + 0.005, 36, 18);
  var wireMat = new THREE.MeshBasicMaterial({
    color: 0x00c9a7,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  var wireMesh = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireMesh);

  // Atmosphere glow
  var atmosGeo = new THREE.SphereGeometry(radius + 0.15, 64, 64);
  var atmosMat = new THREE.ShaderMaterial({
    vertexShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  vNormal = normalize(normalMatrix * normal);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);',
      '  gl_FragColor = vec4(0.0, 0.79, 0.65, 1.0) * intensity * 0.6;',
      '}'
    ].join('\n'),
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmosphereMesh);

  // Inner glow (front-side rim light)
  var innerGlowGeo = new THREE.SphereGeometry(radius + 0.01, 64, 64);
  var innerGlowMat = new THREE.ShaderMaterial({
    vertexShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  vNormal = normalize(normalMatrix * normal);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);',
      '  gl_FragColor = vec4(0.0, 0.6, 0.8, 1.0) * intensity * 0.3;',
      '}'
    ].join('\n'),
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  scene.add(new THREE.Mesh(innerGlowGeo, innerGlowMat));

  return radius;
}

// Create theater markers
function createMarkers(radius) {
  markerGroup = new THREE.Group();
  ringGroup = new THREE.Group();
  arcGroup = new THREE.Group();
  scene.add(markerGroup);
  scene.add(ringGroup);
  scene.add(arcGroup);
}

// Update markers based on current game state
function updateMarkers(radius) {
  // Clear existing
  while (markerGroup.children.length) markerGroup.remove(markerGroup.children[0]);
  while (ringGroup.children.length) ringGroup.remove(ringGroup.children[0]);
  while (arcGroup.children.length) arcGroup.remove(arcGroup.children[0]);

  if (!window.G || !G.geo) return;

  var theaterIds = window.THEATER_IDS || Object.keys(THEATER_COORDS);

  for (var i = 0; i < theaterIds.length; i++) {
    var tid = theaterIds[i];
    var coords = THEATER_COORDS[tid];
    if (!coords) continue;

    var theater = window.THEATERS ? window.THEATERS[tid] : null;
    var state = G.geo.theaters[tid];
    var risk = state ? state.risk : (theater ? theater.baseRisk : 1);
    var color = theater ? theater.color : '#00c9a7';

    // Count active events
    var eventCount = 0;
    for (var j = 0; j < G.geo.activeEvents.length; j++) {
      if (G.geo.activeEvents[j].theaterId === tid && !G.geo.activeEvents[j].resolved) eventCount++;
    }

    var pos = latLngToVec3(coords[0], coords[1], radius);
    var c = new THREE.Color(color);

    // Marker dot
    var dotSize = 0.03 + (risk * 0.012);
    var dotGeo = new THREE.SphereGeometry(dotSize, 12, 12);
    var dotMat = new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0.9,
    });
    var dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    dot.userData = { theaterId: tid, name: theater ? theater.name : tid, risk: risk, events: eventCount, color: color };
    markerGroup.add(dot);

    // Glow ring (pulsing for active events)
    var ringGeo = new THREE.RingGeometry(dotSize + 0.01, dotSize + 0.03, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: eventCount > 0 ? 0.5 : 0.15,
      side: THREE.DoubleSide,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    ring.userData = { pulse: eventCount > 0, baseOpacity: eventCount > 0 ? 0.5 : 0.15, time: Math.random() * Math.PI * 2 };
    ringGroup.add(ring);

    // Outer ring for critical risk
    if (risk >= 4) {
      var outerGeo = new THREE.RingGeometry(dotSize + 0.04, dotSize + 0.07, 32);
      var outerMat = new THREE.MeshBasicMaterial({
        color: 0xe84848,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      var outerRing = new THREE.Mesh(outerGeo, outerMat);
      outerRing.position.copy(pos);
      outerRing.lookAt(new THREE.Vector3(0, 0, 0));
      outerRing.userData = { pulse: true, baseOpacity: 0.3, time: Math.random() * Math.PI * 2 };
      ringGroup.add(outerRing);
    }

    // Vertical beam for active theaters
    if (eventCount > 0) {
      var beamGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.3, 4);
      var beamMat = new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.25,
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      var beamDir = pos.clone().normalize();
      beam.position.copy(pos.clone().add(beamDir.clone().multiplyScalar(0.15)));
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamDir);
      markerGroup.add(beam);
    }
  }

  // Draw arcs between theaters with active events
  drawArcs(radius);
}

// Draw curved arcs between active theaters
function drawArcs(radius) {
  if (!window.G || !G.geo) return;

  // Collect theaters with active events
  var activeTheaters = [];
  var theaterIds = window.THEATER_IDS || Object.keys(THEATER_COORDS);
  for (var i = 0; i < theaterIds.length; i++) {
    var tid = theaterIds[i];
    for (var j = 0; j < G.geo.activeEvents.length; j++) {
      if (G.geo.activeEvents[j].theaterId === tid && !G.geo.activeEvents[j].resolved) {
        activeTheaters.push(tid);
        break;
      }
    }
  }

  // Draw arcs between pairs
  for (var a = 0; a < activeTheaters.length; a++) {
    for (var b = a + 1; b < activeTheaters.length; b++) {
      var c1 = THEATER_COORDS[activeTheaters[a]];
      var c2 = THEATER_COORDS[activeTheaters[b]];
      if (!c1 || !c2) continue;

      var start = latLngToVec3(c1[0], c1[1], radius);
      var end = latLngToVec3(c2[0], c2[1], radius);

      // Mid-point elevated above surface
      var mid = start.clone().add(end).multiplyScalar(0.5);
      var midLen = mid.length();
      var elevation = radius + 0.3 + (midLen * 0.15);
      mid.normalize().multiplyScalar(elevation);

      var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      var points = curve.getPoints(40);
      var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      var lineMat = new THREE.LineBasicMaterial({
        color: 0x00c9a7,
        transparent: true,
        opacity: 0.12,
      });
      arcGroup.add(new THREE.Line(lineGeo, lineMat));
    }
  }
}

// Initialize the globe
function initGlobe(containerEl) {
  if (!window.THREE) return;

  container = containerEl;

  // Scene
  scene = new THREE.Scene();

  // Camera
  var w = container.clientWidth;
  var h = container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0.5, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Lights
  var ambient = new THREE.AmbientLight(0x0a1428, 1.5);
  scene.add(ambient);

  var dirLight = new THREE.DirectionalLight(0x4a90d9, 0.4);
  dirLight.position.set(5, 3, 5);
  scene.add(dirLight);

  var pointLight = new THREE.PointLight(0x00c9a7, 0.6, 20);
  pointLight.position.set(-3, 2, 4);
  scene.add(pointLight);

  // Earth
  var radius = createEarth();
  createMarkers(radius);
  updateMarkers(radius);

  // Mouse interaction
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var lastMouse = { x: 0, y: 0 };
  var rotVelX = 0, rotVelY = 0;

  container.addEventListener('mousedown', function (e) {
    mouseDown = true;
    autoRotate = false;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    rotVelX = 0;
    rotVelY = 0;
  });

  container.addEventListener('mousemove', function (e) {
    // Update mouse for raycasting
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (mouseDown) {
      var dx = e.clientX - lastMouse.x;
      var dy = e.clientY - lastMouse.y;
      earthMesh.rotation.y += dx * 0.005;
      earthMesh.rotation.x += dy * 0.005;
      earthMesh.rotation.x = Math.max(-1.2, Math.min(1.2, earthMesh.rotation.x));
      rotVelX = dy * 0.005;
      rotVelY = dx * 0.005;
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }

    // Raycast for tooltip
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(markerGroup.children);
    if (intersects.length > 0 && intersects[0].object.userData.theaterId) {
      var data = intersects[0].object.userData;
      if (hoveredMarker !== data.theaterId) {
        hoveredMarker = data.theaterId;
        showMarkerTooltip(data, e);
      } else {
        moveTooltip(e);
      }
      container.style.cursor = 'pointer';
    } else {
      if (hoveredMarker) {
        hoveredMarker = null;
        hideTooltip();
      }
      container.style.cursor = mouseDown ? 'grabbing' : 'grab';
    }
  });

  container.addEventListener('mouseup', function () {
    mouseDown = false;
    // Resume auto-rotate after inactivity
    setTimeout(function () { if (!mouseDown) autoRotate = true; }, 3000);
  });

  container.addEventListener('mouseleave', function () {
    mouseDown = false;
    hoveredMarker = null;
    hideTooltip();
    setTimeout(function () { if (!mouseDown) autoRotate = true; }, 1000);
  });

  container.addEventListener('wheel', function (e) {
    e.preventDefault();
    camera.position.z += e.deltaY * 0.003;
    camera.position.z = Math.max(3, Math.min(8, camera.position.z));
  }, { passive: false });

  // Click to scroll to theater
  container.addEventListener('click', function (e) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(markerGroup.children);
    if (intersects.length > 0 && intersects[0].object.userData.theaterId) {
      var tid = intersects[0].object.userData.theaterId;
      // Scroll theater card into view
      var card = document.querySelector('.geo-theater-card[data-theater="' + tid + '"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Resize handler
  window.addEventListener('resize', function () {
    if (!container || !isVisible) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation loop
  var clock = new THREE.Clock();
  function animate() {
    if (!isVisible) { animId = null; return; }
    animId = requestAnimationFrame(animate);

    var t = clock.getElapsedTime();

    // Auto rotate
    if (autoRotate) {
      earthMesh.rotation.y += autoRotateSpeed;
    } else {
      // Momentum
      earthMesh.rotation.y += rotVelY;
      earthMesh.rotation.x += rotVelX;
      rotVelX *= 0.95;
      rotVelY *= 0.95;
    }

    // Sync all groups with earth rotation
    markerGroup.rotation.copy(earthMesh.rotation);
    ringGroup.rotation.copy(earthMesh.rotation);
    arcGroup.rotation.copy(earthMesh.rotation);

    // Pulse rings
    for (var i = 0; i < ringGroup.children.length; i++) {
      var ring = ringGroup.children[i];
      if (ring.userData.pulse) {
        ring.userData.time += 0.03;
        var s = 1 + Math.sin(ring.userData.time) * 0.3;
        ring.scale.set(s, s, s);
        ring.material.opacity = ring.userData.baseOpacity * (0.5 + Math.sin(ring.userData.time) * 0.5);
      }
    }

    renderer.render(scene, camera);
  }

  isVisible = true;
  animate();
}

// Tooltip management
function showMarkerTooltip(data, e) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'globe-tooltip';
    document.body.appendChild(tooltipEl);
  }
  var riskLabel = data.risk >= 4 ? 'CRITICAL' : data.risk >= 3 ? 'HIGH' : data.risk >= 2 ? 'ELEVATED' : 'LOW';
  var riskColor = data.risk >= 4 ? '#e84848' : data.risk >= 3 ? '#e8a838' : data.risk >= 2 ? '#4a90d9' : '#48c878';
  tooltipEl.innerHTML = '<div class="gt-name" style="color:' + data.color + '">' + data.name + '</div>' +
    '<div class="gt-risk" style="color:' + riskColor + '">RISK: ' + riskLabel + '</div>' +
    (data.events > 0 ? '<div class="gt-events">' + data.events + ' active event' + (data.events > 1 ? 's' : '') + '</div>' : '') +
    '<div class="gt-hint">Click to focus</div>';
  tooltipEl.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  tooltipEl.style.left = (e.clientX + 14) + 'px';
  tooltipEl.style.top = (e.clientY - 10) + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none';
}

// Public API
window.GlobeView = {
  init: function (containerEl) {
    if (globe) return; // Already initialized
    globe = true;
    initGlobe(containerEl);
  },
  show: function () {
    isVisible = true;
    if (!animId && renderer) {
      var animate = function () {
        if (!isVisible) { animId = null; return; }
        animId = requestAnimationFrame(animate);
        if (autoRotate) earthMesh.rotation.y += autoRotateSpeed;
        markerGroup.rotation.copy(earthMesh.rotation);
        ringGroup.rotation.copy(earthMesh.rotation);
        arcGroup.rotation.copy(earthMesh.rotation);

        for (var i = 0; i < ringGroup.children.length; i++) {
          var ring = ringGroup.children[i];
          if (ring.userData.pulse) {
            ring.userData.time += 0.03;
            var s = 1 + Math.sin(ring.userData.time) * 0.3;
            ring.scale.set(s, s, s);
            ring.material.opacity = ring.userData.baseOpacity * (0.5 + Math.sin(ring.userData.time) * 0.5);
          }
        }

        renderer.render(scene, camera);
      };
      animate();
    }
  },
  hide: function () {
    isVisible = false;
  },
  refresh: function () {
    if (!scene) return;
    updateMarkers(2);
  },
  resize: function () {
    if (!container || !renderer || !camera) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  },
};

})();
