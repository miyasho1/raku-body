const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

const FACE_POINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FACE_VISIBILITY = 0.65;

let loading = null;

function wasmBase() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/mediapipe`;
}

async function loadDetectors() {
  if (!loading) {
    loading = (async () => {
      const { FilesetResolver, PoseLandmarker, FaceDetector } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(wasmBase());
      const pose = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        numPoses: 1
      });
      const face = await FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5
      });
      return { pose, face };
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

const inFrame = (p) => p && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;

export async function inspectBodyPhoto(file) {
  if (!file) return { ok: false, reason: 'no_file' };
  let detectors;
  try {
    detectors = await loadDetectors();
  } catch {
    return { ok: false, reason: 'check_failed' };
  }
  let loaded;
  try {
    loaded = await fileToImage(file);
  } catch {
    return { ok: false, reason: 'check_failed' };
  }
  const { img, url } = loaded;
  try {
    const faceResult = detectors.face.detect(img);
    const faceByDetector = (faceResult.detections || []).length > 0;

    const poseResult = detectors.pose.detect(img);
    const landmarks = (poseResult.landmarks || [])[0] || null;
    const faceByPose = Boolean(landmarks) && FACE_POINTS.some((i) => {
      const p = landmarks[i];
      return inFrame(p) && (p.visibility ?? 0) >= FACE_VISIBILITY;
    });

    let shoulderHipRatio = null;
    if (landmarks) {
      const ls = landmarks[11];
      const rs = landmarks[12];
      const lh = landmarks[23];
      const rh = landmarks[24];
      const visible = [ls, rs, lh, rh].every((p) => inFrame(p) && (p.visibility ?? 0) >= 0.5);
      if (visible) {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const dist = (a, b) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
        const shoulder = dist(ls, rs);
        const hip = dist(lh, rh);
        if (hip > 0) shoulderHipRatio = Number((shoulder / hip).toFixed(2));
      }
    }

    return {
      ok: true,
      faceDetected: faceByDetector || faceByPose,
      poseFound: Boolean(landmarks),
      shoulderHipRatio
    };
  } catch {
    return { ok: false, reason: 'check_failed' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
